# /// script
# requires-python = ">=3.10"
# dependencies = ["curl-cffi==0.16.0"]
# ///
"""Fetch a URL with a Chrome TLS fingerprint.

Invoked by the import pipeline (src/lib/import/fetch.ts). To run it manually,
use the repo script entry: `vp run import:fetch -- <url>` (requires uv).
"""

import ipaddress
import socket
import sys
from urllib.parse import urljoin, urlparse

from curl_cffi import requests
from curl_cffi.const import CurlOpt

MAX_REDIRECTS = 5
MAX_HTML_BYTES = 4 * 1024 * 1024


def pinned_address(hostname: str, port: int | None) -> str:
    try:
        infos = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)
    except socket.gaierror as error:
        raise SystemExit(f"cannot resolve host: {hostname}") from error
    if not infos:
        raise SystemExit(f"cannot resolve host: {hostname}")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise SystemExit(f"refusing private address for {hostname}")
    return str(infos[0][4][0])


def read_html_body(response) -> str:
    chunks: list[bytes] = []
    received = 0
    for chunk in response.iter_content(chunk_size=65536):
        received += len(chunk)
        if received > MAX_HTML_BYTES:
            raise SystemExit("response too large")
        chunks.append(chunk)
    return b"".join(chunks).decode("utf-8", errors="replace")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: import-fetch.py <url>")
    url = sys.argv[1]
    for _ in range(MAX_REDIRECTS + 1):
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            raise SystemExit(f"unsupported url: {url}")
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        ip = pinned_address(parsed.hostname, parsed.port)
        # Pin the validated address for the actual connection so a second DNS
        # resolution cannot rebound to a private address; Host/SNI stay intact.
        resolve_ip = f"[{ip}]" if ":" in ip else ip
        response = requests.get(
            url,
            impersonate="chrome",
            timeout=30,
            allow_redirects=False,
            stream=True,
            curl_options={CurlOpt.RESOLVE: [f"{parsed.hostname}:{port}:{resolve_ip}"]},
        )
        try:
            if response.is_redirect:
                location = response.headers.get("location")
                if not location:
                    raise SystemExit(f"redirect without location: {url}")
                url = urljoin(url, location)
                continue
            response.raise_for_status()
            content_type = response.headers.get("content-type") or ""
            if "html" not in content_type.lower():
                raise SystemExit(f"not an html page: {url}")
            sys.stdout.write(read_html_body(response))
        finally:
            response.close()
        return
    raise SystemExit("too many redirects")


if __name__ == "__main__":
    main()
