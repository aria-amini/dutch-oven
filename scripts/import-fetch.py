"""Fetch a URL with a Chrome TLS fingerprint. Run via `uv run --with curl-cffi`."""

import ipaddress
import socket
import sys
from urllib.parse import urljoin, urlparse

from curl_cffi import requests

MAX_REDIRECTS = 5


def assert_public_http_url(raw: str) -> None:
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise SystemExit(f"unsupported url: {raw}")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port)
    except socket.gaierror:
        raise SystemExit(f"cannot resolve host: {parsed.hostname}")
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
            raise SystemExit(f"refusing private address for {parsed.hostname}")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: import-fetch.py <url>")
    url = sys.argv[1]
    for _ in range(MAX_REDIRECTS + 1):
        assert_public_http_url(url)
        response = requests.get(
            url, impersonate="chrome", timeout=30, allow_redirects=False
        )
        if response.is_redirect:
            location = response.headers.get("location")
            if not location:
                raise SystemExit(f"redirect without location: {url}")
            url = urljoin(url, location)
            continue
        response.raise_for_status()
        sys.stdout.write(response.text)
        return
    raise SystemExit("too many redirects")


if __name__ == "__main__":
    main()
