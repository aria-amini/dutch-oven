-- Ingredients group by food category instead of storage location.
-- Match names against the staples catalog first, then the sprite aliases.
-- Leftover freezer items become frozen; everything else is other.
ALTER TABLE "pantry_items" ADD COLUMN "category" text;--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'spices'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'allspice', 'bay leaves', 'black pepper', 'cajun seasoning', 'cardamom',
	'cayenne', 'chili powder', 'chinese five spice', 'cinnamon', 'cloves',
	'coriander', 'cumin', 'curry powder', 'dill', 'dried basil',
	'everything bagel seasoning', 'fennel seeds', 'garam masala',
	'garlic powder', 'ground ginger', 'italian seasoning', 'mustard seeds',
	'nutmeg', 'onion powder', 'oregano', 'paprika', 'red pepper flakes',
	'rosemary', 'saffron', 'sage', 'salt', 'sesame seeds', 'smoked paprika',
	'star anise', 'sumac', 'thyme', 'turmeric', 'vanilla extract', 'za''atar'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'meat'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'bacon', 'brisket', 'chicken breast', 'chicken thighs', 'chicken wings',
	'chorizo', 'cod', 'deli turkey', 'ground beef', 'ground pork',
	'ground turkey', 'ham', 'hot dogs', 'lamb', 'pork chops', 'pork shoulder',
	'prosciutto', 'salami', 'salmon', 'sausage', 'scallops', 'shrimp', 'steak',
	'tempeh', 'tilapia', 'tofu', 'tuna steak', 'turkey breast', 'whole chicken'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'dairy'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'almond milk', 'brie', 'butter', 'buttermilk', 'cheddar', 'cottage cheese',
	'cream cheese', 'eggs', 'feta', 'goat cheese', 'greek yogurt', 'gruyere',
	'half and half', 'heavy cream', 'milk', 'mozzarella', 'oat milk',
	'parmesan', 'ricotta', 'sour cream', 'swiss cheese', 'yogurt'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'vegetables'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'arugula', 'asparagus', 'avocados', 'bell peppers', 'broccoli',
	'brussels sprouts', 'cabbage', 'carrots', 'cauliflower', 'celery',
	'cherry tomatoes', 'cilantro', 'corn', 'cucumbers', 'eggplant',
	'fresh basil', 'fresh ginger', 'fresh thyme', 'garlic', 'green beans',
	'jalapeños', 'kale', 'lettuce', 'mushrooms', 'onions', 'parsley', 'peas',
	'potatoes', 'red onion', 'scallions', 'shallots', 'spinach',
	'sweet potatoes', 'tomatoes', 'zucchini'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'fruit'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'apples', 'bananas', 'blueberries', 'cherries', 'grapes', 'kiwi', 'lemons',
	'limes', 'mango', 'oranges', 'peaches', 'pears', 'pineapple', 'raisins',
	'raspberries', 'strawberries', 'watermelon'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'grains'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'baking powder', 'baking soda', 'bread', 'breadcrumbs', 'brown rice',
	'brown sugar', 'cereal', 'chocolate chips', 'cocoa powder', 'cornstarch',
	'couscous', 'crackers', 'egg noodles', 'flour', 'honey', 'maple syrup',
	'oats', 'panko', 'pasta', 'powdered sugar', 'quinoa', 'rice',
	'rice noodles', 'spaghetti', 'sugar', 'tortillas', 'yeast'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'cans'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'almonds', 'black beans', 'canned tomatoes', 'canned tuna', 'chicken broth',
	'chickpeas', 'coconut milk', 'kidney beans', 'lentils', 'olives',
	'peanut butter', 'peanuts', 'pickles', 'tomato paste', 'tomato sauce',
	'vegetable broth', 'walnuts'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'sauces'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'apple cider vinegar', 'balsamic vinegar', 'bbq sauce', 'dijon',
	'fish sauce', 'hoisin sauce', 'hot sauce', 'jam', 'ketchup', 'mayonnaise',
	'mustard', 'olive oil', 'oyster sauce', 'pesto', 'red wine vinegar',
	'rice vinegar', 'salsa', 'sesame oil', 'soy sauce', 'sriracha', 'tahini',
	'vegetable oil', 'white vinegar', 'worcestershire sauce'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'frozen'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'dumplings', 'frozen berries', 'frozen broccoli', 'frozen corn',
	'frozen fries', 'frozen peas', 'frozen pizza', 'frozen shrimp',
	'frozen spinach', 'ice', 'ice cream', 'pie crust', 'puff pastry', 'waffles'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'fruit'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'apple', 'apples', 'apricot', 'apricots', 'avocado', 'avocados', 'banana',
	'bananas', 'berries', 'berry', 'blackberries', 'blackberry', 'blueberries',
	'blueberry', 'cantaloupe', 'cherries', 'cherry', 'clementine', 'grape',
	'grapes', 'honeydew', 'lemon', 'lemons', 'lime', 'limes', 'mandarin',
	'mango', 'mangoes', 'melon', 'nectarine', 'orange', 'oranges', 'peach',
	'peaches', 'pear', 'pears', 'pineapple', 'raisins', 'raspberries',
	'raspberry', 'strawberries', 'strawberry', 'tangerine', 'watermelon'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'meat'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'bacon', 'beef', 'bratwurst', 'brisket', 'chicken', 'chorizo', 'cod',
	'drumstick', 'drumsticks', 'egg', 'eggs', 'filet', 'fish', 'ground beef',
	'ground pork', 'ground turkey', 'halibut', 'ham', 'kielbasa', 'lamb', 'lox',
	'meat', 'mince', 'pancetta', 'pepperoni', 'pork', 'prosciutto', 'ribeye',
	'roast', 'salami', 'salmon', 'sausage', 'sausages', 'sea bass', 'sirloin',
	'smoked salmon', 'steak', 'thighs', 'tilapia', 'trout', 'tuna', 'wings'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'vegetables'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'arugula', 'aubergine', 'beet', 'beets', 'bell pepper', 'bell peppers',
	'broccoli', 'butternut squash', 'button mushrooms', 'canned tomatoes',
	'carrot', 'carrots', 'chard', 'collard greens', 'collards', 'corn',
	'cornmeal', 'courgette', 'cremini', 'crushed tomatoes', 'cucumber',
	'cucumbers', 'eggplant', 'garlic', 'garlic cloves', 'green peas', 'greens',
	'iceberg', 'kalamata', 'kale', 'leek', 'leeks', 'lettuce', 'mushroom',
	'mushrooms', 'olive', 'olives', 'onion', 'onions', 'paprika', 'passata',
	'peas', 'pepper', 'peppers', 'pickle', 'pickles', 'polenta', 'portobello',
	'potato', 'potatoes', 'pumpkin', 'radish', 'radishes', 'red onion',
	'romaine', 'salad greens', 'scallion', 'scallions', 'shallot', 'shallots',
	'shiitake', 'snap peas', 'snow peas', 'spinach', 'spring onion', 'squash',
	'summer squash', 'sweet potato', 'sweet potatoes', 'tomato', 'tomato paste',
	'tomatoes', 'turnip', 'turnips', 'yam', 'yams', 'yellow onion', 'zucchini'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'spices'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'black pepper', 'chile', 'chili', 'chili pepper', 'cinnamon', 'dijon',
	'flaky salt', 'habanero', 'hot pepper', 'jalapeno', 'jalapeño',
	'kosher salt', 'mustard', 'peppercorn', 'peppercorns', 'red pepper flakes',
	'salt', 'sea salt', 'serrano', 'whole grain mustard'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'grains'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'all purpose flour', 'arborio', 'barley', 'basmati', 'bread', 'bread flour',
	'brownie', 'brownies', 'buns', 'cake', 'cookie', 'cookies', 'couscous',
	'flour', 'jasmine rice', 'loaf', 'noodles', 'oatmeal', 'oats', 'pasta',
	'pastry', 'pie', 'quinoa', 'rice', 'risotto', 'rolls', 'spaghetti', 'tart',
	'wheat'
);--> statement-breakpoint
UPDATE "pantry_items" SET "category" = 'dairy'
WHERE "category" IS NULL AND lower(btrim("name")) IN (
	'brie', 'butter', 'buttermilk', 'cheddar', 'cheese', 'cream',
	'creme fraiche', 'feta', 'gouda', 'gruyere', 'half and half', 'heavy cream',
	'milk', 'mozzarella', 'parmesan', 'sour cream', 'yoghurt', 'yogurt'
);--> statement-breakpoint
UPDATE "pantry_items"
SET "category" = CASE WHEN "location" = 'freezer' THEN 'frozen' ELSE 'other' END
WHERE "category" IS NULL;--> statement-breakpoint
ALTER TABLE "pantry_items" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pantry_items" DROP COLUMN "location";
