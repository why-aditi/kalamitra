# # # import google.generativeai as genai
# # # import os
# # # import json
# # # from typing import List, Dict, Any
# # # from fastapi import UploadFile
# # # import asyncio
# # # from PIL import Image
# # # import io
# # # from models.listingModel import Listing

# # # # Configure Gemini API
# # # genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# # # async def generate_listing_with_gemini(transcription: str, images: List[UploadFile]) -> Dict[str, Any]:
# # #     """
# # #     Generate a creative product listing using Google Gemini AI based on transcription and product images.
    
# # #     Args:
# # #         transcription: Voice transcription of product description by the creator
# # #         images: List of uploaded product images (art, crafts, jewelry, clothing, home decor)
        
# # #     Returns:
# # #         Dictionary containing generated listing data matching the Listing model
# # #     """
# # #     try:
# # #         # Initialize the model
# # #         model = genai.GenerativeModel('gemini-2.5-flash')
        
# # #         # Process images for Gemini
# # #         processed_images = []
# # #         for img in images:
# # #             # Reset file pointer
# # #             await img.seek(0)
# # #             img_content = await img.read()
            
# # #             # Convert to PIL Image
# # #             pil_image = Image.open(io.BytesIO(img_content))
            
# # #             # Resize if too large (Gemini has size limits)
# # #             if pil_image.size[0] > 1024 or pil_image.size[1] > 1024:
# # #                 pil_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            
# # #             processed_images.append(pil_image)
        
# # #         # Create the prompt for creative product listings
# # #         prompt = f"""
# # #         You are a professional product curator and listing specialist for creative handmade items. Based on the following creator's voice transcription and product images, create a compelling listing for an online creative marketplace in India.

# # #         Creator's Transcription: "{transcription}"

# # #         Please analyze the product images and transcription to generate a JSON response with the following EXACT structure:
# # #         {{
# # #             "title": "Compelling product title",
# # #             "description": "Detailed product description (150-250 words) including materials, craftsmanship, features, and appeal",
# # #             "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
# # #             "category": "Art/Crafts/Jewelry/Clothing/Home & Decor/etc.",
# # #             "suggestedPrice": "₹XXX",
# # #             "story": "Creator's story and inspiration behind the piece (100-150 words)"
# # #         }}

# # #         Guidelines for creative product listings:
# # #         - Title should be descriptive and appealing to Indian buyers
# # #         - Description should highlight materials, craftsmanship, quality, and unique features
# # #         - Tags should include: materials, style, colors, occasion, function, and relevant keywords (use proper case)
# # #         - Category should match the product type accurately (use "Home & Decor" for home decor items)
# # #         - Price should be in Indian Rupees (₹) and reasonable based on materials, time invested, and Indian market value
# # #         - Story should be personal and connect with potential buyers
# # #         - Make it appealing to people looking for unique, handmade items
# # #         - Extract materials, techniques, and inspiration from transcription and images
# # #         - If the creator mentions their background or inspiration, include it in the story
# # #         - Consider Indian cultural context and traditional craftsmanship
# # #         - Ensure the response is valid JSON

# # #         Product Categories:
# # #         - Art: Painting, Drawing, Sculpture, Digital Art, Photography, Mixed Media, Printmaking
# # #         - Crafts: Handmade Items, DIY Projects, Woodworking, Pottery, Ceramics, Paper Crafts
# # #         - Jewelry: Necklaces, Earrings, Bracelets, Rings, Brooches, Custom Jewelry
# # #         - Clothing: Handmade Apparel, Vintage Clothing, Accessories, Bags, Scarves
# # #         - Home & Decor: Wall Art, Furniture, Lighting, Textiles, Decorative Objects, Candles, Diyas

# # #         Example tags format (use proper case):
# # #         - Art: ["Acrylic", "Oil", "Watercolor", "Abstract", "Contemporary", "Modern", "Canvas"]
# # #         - Crafts: ["Handmade", "Wooden", "Ceramic", "Pottery", "Rustic", "Artisan", "Traditional"]
# # #         - Jewelry: ["Sterling Silver", "Gold", "Gemstone", "Beaded", "Elegant", "Statement", "Handcrafted"]
# # #         - Clothing: ["Vintage", "Boho", "Handmade", "Cotton", "Silk", "Designer", "Sustainable"]
# # #         - Home & Decor: ["Rustic", "Modern", "Decorative", "Functional", "Cozy", "Elegant", "Traditional"]

# # #         IMPORTANT: Always use ₹ symbol for pricing and format as "₹XXX" (single price, not range)
# # #         """
        
# # #         # Prepare content for Gemini
# # #         content = [prompt]
# # #         content.extend(processed_images)
        
# # #         # Generate response
# # #         response = await asyncio.to_thread(model.generate_content, content)
        
# # #         # Parse the response
# # #         response_text = response.text.strip()
        
# # #         # Clean up the response (remove markdown formatting if present)
# # #         if response_text.startswith('```json'):
# # #             response_text = response_text[7:-3].strip()
# # #         elif response_text.startswith('```'):
# # #             response_text = response_text[3:-3].strip()
        
# # #         # Parse JSON response
# # #         try:
# # #             listing_data = json.loads(response_text)
# # #         except json.JSONDecodeError:
# # #             # Fallback if JSON parsing fails
# # #             listing_data = create_fallback_product_listing(transcription)
        
# # #         # Validate and clean the data
# # #         listing_data = validate_art_listing_data(listing_data)
        
# # #         return listing_data
        
# # #     except Exception as e:
# # #         print(f"Error generating art listing with Gemini: {str(e)}")
# # #         # Return fallback listing
# # #         return create_fallback_product_listing(transcription)

# # # def create_fallback_product_listing(transcription: str) -> Dict[str, Any]:
# # #     """
# # #     Create a basic product listing when AI generation fails.
# # #     """
# # #     return {
# # #         "title": "Unique Handmade Item",
# # #         "description": f"Beautiful handcrafted item created with care and attention to detail. {transcription}",
# # #         "tags": ["Handmade", "Unique", "Creative", "Artisan", "Custom"],
# # #         "category": "Crafts",
# # #         "suggestedPrice": "₹299",
# # #         "story": f"This piece represents the creator's passion for handmade craftsmanship. {transcription[:100]}...",
# # #         "generated_at": "2025-07-13",
# # #         "ai_generated": True,
# # #         "transcription_source": transcription,
# # #         "fallback_used": True
# # #     }

# # # def validate_art_listing_data(listing_data: Dict[str, Any]) -> Dict[str, Any]:
# # #     """
# # #     Validate and clean the generated product listing data according to the Listing model.
# # #     """
# # #     # Required fields from the Listing model
# # #     required_fields = ["title", "description", "tags", "category", "suggestedPrice", "story"]
    
# # #     for field in required_fields:
# # #         if field not in listing_data or listing_data[field] is None:
# # #             if field == "tags":
# # #                 listing_data[field] = ["Handmade", "Unique"]
# # #             elif field == "title":
# # #                 listing_data[field] = "Unique Handmade Item"
# # #             elif field == "description":
# # #                 listing_data[field] = "Beautiful handcrafted item with attention to detail"
# # #             elif field == "category":
# # #                 listing_data[field] = "Crafts"
# # #             elif field == "suggestedPrice":
# # #                 listing_data[field] = "₹299"
# # #             elif field == "story":
# # #                 listing_data[field] = "This piece represents the creator's passion for handmade craftsmanship"
    
# # #     # Ensure tags is a list
# # #     if not isinstance(listing_data["tags"], list):
# # #         listing_data["tags"] = ["Handmade", "Unique"]
    
# # #     # Limit tags to reasonable number
# # #     if len(listing_data["tags"]) > 10:
# # #         listing_data["tags"] = listing_data["tags"][:10]
    
# # #     # Ensure all fields are strings except tags
# # #     string_fields = ["title", "description", "category", "suggestedPrice", "story"]
# # #     for field in string_fields:
# # #         if not isinstance(listing_data[field], str):
# # #             listing_data[field] = str(listing_data[field])
    
# # #     return listing_data

# # # def get_art_category_suggestions() -> List[str]:
# # #     """
# # #     Return all creative product categories for reference.
# # #     """
# # #     return [
# # #         # Art Categories
# # #         "Painting", "Drawing", "Sculpture", "Digital Art", "Photography", 
# # #         "Mixed Media", "Printmaking", "Abstract Art", "Figurative Art", 
# # #         "Landscape", "Portrait", "Still Life",
        
# # #         # Crafts Categories
# # #         "Handmade Items", "DIY Projects", "Woodworking", "Pottery", 
# # #         "Ceramics", "Paper Crafts", "Leather Goods", "Candles", 
# # #         "Soap Making", "Embroidery", "Knitting", "Crochet",
        
# # #         # Jewelry Categories
# # #         "Necklaces", "Earrings", "Bracelets", "Rings", "Brooches", 
# # #         "Custom Jewelry", "Beaded Jewelry", "Wire Jewelry", "Pendant", 
# # #         "Charm Jewelry", "Statement Jewelry",
        
# # #         # Clothing Categories
# # #         "Handmade Apparel", "Vintage Clothing", "Accessories", "Bags", 
# # #         "Scarves", "Hats", "Shoes", "Dresses", "Tops", "Bottoms",
# # #         "Outerwear", "Swimwear", "Lingerie",
        
# # #         # Home Decor Categories
# # #         "Wall Art", "Furniture", "Lighting", "Textiles", "Decorative Objects", 
# # #         "Candles", "Vases", "Mirrors", "Clocks", "Pillows", "Throws", 
# # #         "Rugs", "Curtains", "Plants & Planters", "Kitchen Decor", 
# # #         "Bathroom Decor", "Seasonal Decor"
# # #     ]

# # # def get_common_art_tags() -> List[str]:
# # #     """
# # #     Return common tags for all creative products.
# # #     """
# # #     return [
# # #         # Art tags
# # #         "acrylic", "oil", "watercolor", "abstract", "contemporary", "modern", 
# # #         "vintage", "canvas", "framed", "original", "print", "colorful", 
# # #         "monochrome", "expressionist", "minimalist", "detailed", "textured",
        
# # #         # Craft tags
# # #         "handmade", "wooden", "ceramic", "pottery", "rustic", "custom", 
# # #         "artisan", "carved", "painted", "glazed", "fired", "thrown", 
# # #         "woven", "embroidered", "knitted", "crocheted", "sewn",
        
# # #         # Jewelry tags
# # #         "sterling silver", "gold", "gold-filled", "rose gold", "gemstone", 
# # #         "beaded", "elegant", "statement", "delicate", "vintage", "bohemian", 
# # #         "minimalist", "layered", "pendant", "charm", "crystal", "pearl",
        
# # #         # Clothing tags
# # #         "cotton", "silk", "linen", "wool", "cashmere", "vintage", "boho", 
# # #         "sustainable", "eco-friendly", "designer", "custom", "tailored", 
# # #         "comfortable", "stylish", "trendy", "classic", "casual", "formal",
        
# # #         # Home decor tags
# # #         "decorative", "functional", "cozy", "elegant", "rustic", "modern", 
# # #         "minimalist", "farmhouse", "industrial", "scandinavian", "bohemian", 
# # #         "vintage", "antique", "repurposed", "upcycled", "seasonal", "holiday",
        
# # #         # Universal tags
# # #         "unique", "creative", "artistic", "quality", "durable", "gift", 
# # #         "collectible", "one-of-a-kind", "limited edition", "handcrafted", 
# # #         "made-to-order", "personalized", "custom-made"
# # #     ]



# # import google.generativeai as genai
# # import os
# # import json
# # from typing import List, Dict, Any
# # from fastapi import UploadFile
# # import asyncio
# # from PIL import Image
# # import io
# # from models.listingModel import Listing # Assuming Listing model defines these fields

# # # Configure Gemini API
# # genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# # async def generate_listing_with_gemini(transcription: str, images: List[UploadFile]) -> Dict[str, Any]:
# #     """
# #     Generate a creative product listing using Google Gemini AI based on transcription and product images.

# #     Args:
# #         transcription: Voice transcription of product description by the creator
# #         images: List of uploaded product images (art, crafts, jewelry, clothing, home decor)

# #     Returns:
# #         Dictionary containing generated listing data matching the Listing model
# #     """
# #     try:
# #         # Initialize the model
# #         model = genai.GenerativeModel('gemini-2.5-flash')

# #         # Process images for Gemini
# #         processed_images = []
# #         for img in images:
# #             # Reset file pointer
# #             await img.seek(0)
# #             img_content = await img.read()

# #             # Convert to PIL Image
# #             pil_image = Image.open(io.BytesIO(img_content))

# #             # Resize if too large (Gemini has size limits)
# #             if pil_image.size[0] > 1024 or pil_image.size[1] > 1024:
# #                 pil_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

# #             processed_images.append(pil_image)

# #         # Create the prompt for creative product listings
# #         prompt = f"""
# #         You are a professional product curator and listing specialist for creative handmade items. Based on the following creator's voice transcription and product images, create a compelling listing for an online creative marketplace in India.
# #         Creator's Transcription: "{transcription}"
# #         Please analyze the product images and transcription to generate a JSON response with the following EXACT structure:
# #         {{
# #             "title": "Compelling product title",
# #             "description": "Detailed product description (150-250 words) including materials, craftsmanship, features, and appeal",
# #             "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
# #             "category": "Art/Crafts/Jewelry/Clothing/Home & Decor/etc.",
# #             "suggestedPrice": "₹XXX",
# #             "story": "Creator's story and inspiration behind the piece (100-150 words)",
# #             "features": ["feature1", "feature2", "feature3"],
# #             "specifications": {{
# #                 "Dimension": "X cm x Y cm",
# #                 "Weight": "Z kg",
# #                 "Material": "Type of material",
# #                 "Color": "Dominant color"
# #             }},
# #             "inStock": true,
# #             "stockCount": 10,
# #             "shippingInfo": {{
# #                 "estimatedDays": "3-5 business days",
# #                 "returnPolicy": "30-day returns"
# #             }},
# #             "reviews": []
# #         }}
# #         Guidelines for creative product listings:
# #         - Title should be descriptive and appealing to Indian buyers
# #         - Description should highlight materials, craftsmanship, quality, and unique features
# #         - Tags should include: materials, style, colors, occasion, function, and relevant keywords (use proper case)
# #         - Category should match the product type accurately (use "Home & Decor" for home decor items)
# #         - Price should be in Indian Rupees (₹) and reasonable based on materials, time invested, and Indian market value
# #         - Story should be personal and connect with potential buyers
# #         - Features should be a list of key selling points.
# #         - Specifications should be a dictionary of important product attributes.
# #         - `inStock` should be a boolean (true/false).
# #         - `stockCount` should be an integer representing available quantity.
# #         - `shippingInfo` should include estimated delivery days and return policy.
# #         - `reviews` should be an empty array initially, as reviews are added by users.
# #         - Make it appealing to people looking for unique, handmade items
# #         - Extract materials, techniques, and inspiration from transcription and images
# #         - If the creator mentions their background or inspiration, include it in the story
# #         - Consider Indian cultural context and traditional craftsmanship
# #         - Ensure the response is valid JSON
# #         Product Categories:
# #         - Art: Painting, Drawing, Sculpture, Digital Art, Photography, Mixed Media, Printmaking
# #         - Crafts: Handmade Items, DIY Projects, Woodworking, Pottery, Ceramics, Paper Crafts
# #         - Jewelry: Necklaces, Earrings, Bracelets, Rings, Brooches, Custom Jewelry
# #         - Clothing: Handmade Apparel, Vintage Clothing, Accessories, Bags, Scarves
# #         - Home & Decor: Wall Art, Furniture, Lighting, Textiles, Decorative Objects, Candles, Diyas
# #         Example tags format (use proper case):
# #         - Art: ["Acrylic", "Oil", "Watercolor", "Abstract", "Contemporary", "Modern", "Canvas"]
# #         - Crafts: ["Handmade", "Wooden", "Ceramic", "Pottery", "Rustic", "Artisan", "Traditional"]
# #         - Jewelry: ["Sterling Silver", "Gold", "Gemstone", "Beaded", "Elegant", "Statement", "Handcrafted"]
# #         - Clothing: ["Vintage", "Boho", "Handmade", "Cotton", "Silk", "Designer", "Sustainable"]
# #         - Home & Decor: ["Rustic", "Modern", "Decorative", "Functional", "Cozy", "Elegant", "Traditional"]
# #         IMPORTANT: Always use ₹ symbol for pricing and format as "₹XXX" (single price, not range)
# #         """

# #         # Prepare content for Gemini
# #         content = [prompt]
# #         content.extend(processed_images)

# #         # Generate response
# #         response = await asyncio.to_thread(model.generate_content, content)

# #         # Parse the response
# #         response_text = response.text.strip()

# #         # Clean up the response (remove markdown formatting if present)
# #         if response_text.startswith('```json'):
# #             response_text = response_text[7:-3].strip()
# #         elif response_text.startswith('```'):
# #             response_text = response_text[3:-3].strip()

# #         # Parse JSON response
# #         try:
# #             listing_data = json.loads(response_text)
# #         except json.JSONDecodeError:
# #             # Fallback if JSON parsing fails
# #             listing_data = create_fallback_product_listing(transcription)

# #         # Validate and clean the data
# #         listing_data = validate_art_listing_data(listing_data)

# #         return listing_data

# #     except Exception as e:
# #         print(f"Error generating art listing with Gemini: {str(e)}")
# #         # Return fallback listing
# #         return create_fallback_product_listing(transcription)

# # def create_fallback_product_listing(transcription: str) -> Dict[str, Any]:
# #     """
# #     Create a basic product listing when AI generation fails.
# #     """
# #     return {
# #         "title": "Unique Handmade Item",
# #         "description": f"Beautiful handcrafted item created with care and attention to detail. {transcription}",
# #         "tags": ["Handmade", "Unique", "Creative", "Artisan", "Custom"],
# #         "category": "Crafts",
# #         "suggestedPrice": "₹299",
# #         "story": f"This piece represents the creator's passion for handmade craftsmanship. {transcription[:100]}...",
# #         "features": [], # Added fallback
# #         "specifications": {}, # Added fallback
# #         "inStock": True, # Added fallback
# #         "stockCount": 10, # Added fallback
# #         "shippingInfo": { # Added fallback
# #             "estimatedDays": "3-5 business days",
# #             "returnPolicy": "30-day returns"
# #         },
# #         "reviews": [], # Added fallback
# #         "generated_at": "2025-07-13",
# #         "ai_generated": True,
# #         "transcription_source": transcription,
# #         "fallback_used": True
# #     }

# # def validate_art_listing_data(listing_data: Dict[str, Any]) -> Dict[str, Any]:
# #     """
# #     Validate and clean the generated product listing data according to the Listing model.
# #     """
# #     # Required fields from the Listing model (expanded)
# #     required_fields = [
# #         "title", "description", "tags", "category", "suggestedPrice", "story",
# #         "features", "specifications", "inStock", "stockCount", "shippingInfo", "reviews"
# #     ]

# #     for field in required_fields:
# #         if field not in listing_data or listing_data[field] is None:
# #             if field == "tags":
# #                 listing_data[field] = ["Handmade", "Unique"]
# #             elif field == "title":
# #                 listing_data[field] = "Unique Handmade Item"
# #             elif field == "description":
# #                 listing_data[field] = "Beautiful handcrafted item with attention to detail"
# #             elif field == "category":
# #                 listing_data[field] = "Crafts"
# #             elif field == "suggestedPrice":
# #                 listing_data[field] = "₹299"
# #             elif field == "story":
# #                 listing_data[field] = "This piece represents the creator's passion for handmade craftsmanship"
# #             elif field == "features": # Added validation for new fields
# #                 listing_data[field] = []
# #             elif field == "specifications": # Added validation for new fields
# #                 listing_data[field] = {}
# #             elif field == "inStock": # Added validation for new fields
# #                 listing_data[field] = True
# #             elif field == "stockCount": # Added validation for new fields
# #                 listing_data[field] = 10
# #             elif field == "shippingInfo": # Added validation for new fields
# #                 listing_data[field] = {"estimatedDays": "3-5 business days", "returnPolicy": "30-day returns"}
# #             elif field == "reviews": # Added validation for new fields
# #                 listing_data[field] = []

# #     # Ensure tags is a list
# #     if not isinstance(listing_data["tags"], list):
# #         listing_data["tags"] = ["Handmade", "Unique"]
# #     # Limit tags to reasonable number
# #     if len(listing_data["tags"]) > 10:
# #         listing_data["tags"] = listing_data["tags"][:10]

# #     # Ensure all fields are strings except tags, features, specifications, inStock, stockCount, shippingInfo, reviews
# #     string_fields = ["title", "description", "category", "suggestedPrice", "story"]
# #     for field in string_fields:
# #         if not isinstance(listing_data[field], str):
# #             listing_data[field] = str(listing_data[field])

# #     # Ensure features is a list of strings
# #     if not isinstance(listing_data["features"], list):
# #         listing_data["features"] = []
# #     listing_data["features"] = [str(f) for f in listing_data["features"] if isinstance(f, (str, int, float, bool))]

# #     # Ensure specifications is a dictionary with string values
# #     if not isinstance(listing_data["specifications"], dict):
# #         listing_data["specifications"] = {}
# #     listing_data["specifications"] = {k: str(v) for k, v in listing_data["specifications"].items()}

# #     # Ensure inStock is boolean
# #     if not isinstance(listing_data["inStock"], bool):
# #         listing_data["inStock"] = True # Default to True

# #     # Ensure stockCount is integer
# #     if not isinstance(listing_data["stockCount"], int):
# #         try:
# #             listing_data["stockCount"] = int(listing_data["stockCount"])
# #         except (ValueError, TypeError):
# #             listing_data["stockCount"] = 10 # Default

# #     # Ensure shippingInfo is a dictionary
# #     if not isinstance(listing_data["shippingInfo"], dict):
# #         listing_data["shippingInfo"] = {"estimatedDays": "N/A", "returnPolicy": "N/A"}

# #     # Ensure reviews is a list
# #     if not isinstance(listing_data["reviews"], list):
# #         listing_data["reviews"] = []

# #     return listing_data

# # def get_art_category_suggestions() -> List[str]:
# #     """
# #     Return all creative product categories for reference.
# #     """
# #     return [
# #         # Art Categories
# #         "Painting", "Drawing", "Sculpture", "Digital Art", "Photography",
# #         "Mixed Media", "Printmaking", "Abstract Art", "Figurative Art",
# #         "Landscape", "Portrait", "Still Life",

# #         # Crafts Categories
# #         "Handmade Items", "DIY Projects", "Woodworking", "Pottery",
# #         "Ceramics", "Paper Crafts", "Leather Goods", "Candles",
# #         "Soap Making", "Embroidery", "Knitting", "Crochet",

# #         # Jewelry Categories
# #         "Necklaces", "Earrings", "Bracelets", "Rings", "Brooches",
# #         "Custom Jewelry", "Beaded Jewelry", "Wire Jewelry", "Pendant",
# #         "Charm Jewelry", "Statement Jewelry",

# #         # Clothing Categories
# #         "Handmade Apparel", "Vintage Clothing", "Accessories", "Bags",
# #         "Scarves", "Hats", "Shoes", "Dresses", "Tops", "Bottoms",
# #         "Outerwear", "Swimwear", "Lingerie",

# #         # Home Decor Categories
# #         "Wall Art", "Furniture", "Lighting", "Textiles", "Decorative Objects",
# #         "Candles", "Vases", "Mirrors", "Clocks", "Pillows", "Throws",
# #         "Rugs", "Curtains", "Plants & Planters", "Kitchen Decor",
# #         "Bathroom Decor", "Seasonal Decor"
# #     ]

# # def get_common_art_tags() -> List[str]:
# #     """
# #     Return common tags for all creative products.
# #     """
# #     return [
# #         # Art tags
# #         "acrylic", "oil", "watercolor", "abstract", "contemporary", "modern",
# #         "vintage", "canvas", "framed", "original", "print", "colorful",
# #         "monochrome", "expressionist", "minimalist", "detailed", "textured",

# #         # Craft tags
# #         "handmade", "wooden", "ceramic", "pottery", "rustic", "custom",
# #         "artisan", "carved", "painted", "glazed", "fired", "thrown",
# #         "woven", "embroidered", "knitted", "crocheted", "sewn",

# #         # Jewelry tags
# #         "sterling silver", "gold", "gold-filled", "rose gold", "gemstone",
# #         "beaded", "elegant", "statement", "delicate", "vintage", "bohemian",
# #         "minimalist", "layered", "pendant", "charm", "crystal", "pearl",

# #         # Clothing tags
# #         "cotton", "silk", "linen", "wool", "cashmere", "vintage", "boho",
# #         "sustainable", "eco-friendly", "designer", "custom", "tailored",
# #         "comfortable", "stylish", "trendy", "classic", "casual", "formal",

# #         # Home decor tags
# #         "decorative", "functional", "cozy", "elegant", "rustic", "modern",
# #         "minimalist", "farmhouse", "industrial", "scandinavian", "bohemian",
# #         "vintage", "antique", "repurposed", "upcycled", "seasonal", "holiday",

# #         # Universal tags
# #         "unique", "creative", "artistic", "quality", "durable", "gift",
# #         "collectible", "one-of-a-kind", "limited edition", "handcrafted",
# #         "made-to-order", "personalized", "custom-made"
# #     ]





# import google.generativeai as genai
# import os
# import json
# from typing import List, Dict, Any
# from fastapi import UploadFile # Keep for type hinting in create_listing, but not used directly in this function
# import asyncio
# from PIL import Image
# import io
# from models.listingModel import Listing # Assuming Listing model defines these fields

# # Configure Gemini API
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# # Modified function signature to accept List[bytes] for images
# async def generate_listing_with_gemini(transcription: str, image_bytes_list: List[bytes]) -> Dict[str, Any]:
#     """
#     Generate a creative product listing using Google Gemini AI based on transcription and product images (as bytes).

#     Args:
#         transcription: Voice transcription of product description by the creator
#         image_bytes_list: List of product image contents as bytes

#     Returns:
#         Dictionary containing generated listing data matching the Listing model
#     """
#     try:
#         # Initialize the model
#         model = genai.GenerativeModel('gemini-2.5-flash')

#         # Process images for Gemini
#         processed_images = []
#         for img_content in image_bytes_list: # Iterate through bytes content directly
#             # Convert to PIL Image
#             pil_image = Image.open(io.BytesIO(img_content))

#             # Resize if too large (Gemini has size limits)
#             if pil_image.size[0] > 1024 or pil_image.size[1] > 1024:
#                 pil_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

#             processed_images.append(pil_image)

#         # Create the prompt for creative product listings
#         prompt = f"""
#         You are a professional product curator and listing specialist for creative handmade items. Based on the following creator's voice transcription and product images, create a compelling listing for an online creative marketplace in India.
#         Creator's Transcription: "{transcription}"
#         Please analyze the product images and transcription to generate a JSON response with the following EXACT structure:
#         {{
#             "title": "Compelling product title",
#             "description": "Detailed product description (150-250 words) including materials, craftsmanship, features, and appeal",
#             "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
#             "category": "Art/Crafts/Jewelry/Clothing/Home & Decor/etc.",
#             "suggestedPrice": "₹XXX",
#             "story": "Creator's story and inspiration behind the piece (100-150 words)",
#             "features": ["feature1", "feature2", "feature3"],
#             "specifications": {{
#                 "Dimension": "X cm x Y cm",
#                 "Weight": "Z kg",
#                 "Material": "Type of material",
#                 "Color": "Dominant color"
#             }},
#             "inStock": true,
#             "stockCount": 10,
#             "shippingInfo": {{
#                 "estimatedDays": "3-5 business days",
#                 "returnPolicy": "30-day returns"
#             }},
#             "reviews": []
#         }}
#         Guidelines for creative product listings:
#         - Title should be descriptive and appealing to Indian buyers
#         - Description should highlight materials, craftsmanship, quality, and unique features
#         - Tags should include: materials, style, colors, occasion, function, and relevant keywords (use proper case)
#         - Category should match the product type accurately (use "Home & Decor" for home decor items)
#         - Price should be in Indian Rupees (₹) and reasonable based on materials, time invested, and Indian market value
#         - Story should be personal and connect with potential buyers
#         - Features should be a list of key selling points.
#         - Specifications should be a dictionary of important product attributes.
#         - `inStock` should be a boolean (true/false).
#         - `stockCount` should be an integer representing available quantity.
#         - `shippingInfo` should include estimated delivery days and return policy.
#         - `reviews` should be an empty array initially, as reviews are added by users.
#         - Make it appealing to people looking for unique, handmade items
#         - Extract materials, techniques, and inspiration from transcription and images
#         - If the creator mentions their background or inspiration, include it in the story
#         - Consider Indian cultural context and traditional craftsmanship
#         - Ensure the response is valid JSON
#         Product Categories:
#         - Art: Painting, Drawing, Sculpture, Digital Art, Photography, Mixed Media, Printmaking
#         - Crafts: Handmade Items, DIY Projects, Woodworking, Pottery, Ceramics, Paper Crafts
#         - Jewelry: Necklaces, Earrings, Bracelets, Rings, Brooches, Custom Jewelry
#         - Clothing: Handmade Apparel, Vintage Clothing, Accessories, Bags, Scarves
#         - Home & Decor: Wall Art, Furniture, Lighting, Textiles, Decorative Objects, Candles, Diyas
#         Example tags format (use proper case):
#         - Art: ["Acrylic", "Oil", "Watercolor", "Abstract", "Contemporary", "Modern", "Canvas"]
#         - Crafts: ["Handmade", "Wooden", "Ceramic", "Pottery", "Rustic", "Artisan", "Traditional"]
#         - Jewelry: ["Sterling Silver", "Gold", "Gemstone", "Beaded", "Elegant", "Statement", "Handcrafted"]
#         - Clothing: ["Vintage", "Boho", "Handmade", "Cotton", "Silk", "Designer", "Sustainable"]
#         - Home & Decor: ["Rustic", "Modern", "Decorative", "Functional", "Cozy", "Elegant", "Traditional"]
#         IMPORTANT: Always use ₹ symbol for pricing and format as "₹XXX" (single price, not range)
#         """

#         # Prepare content for Gemini
#         content = [prompt]
#         content.extend(processed_images)

#         # Generate response
#         response = await asyncio.to_thread(model.generate_content, content)

#         # Parse the response
#         response_text = response.text.strip()

#         # Clean up the response (remove markdown formatting if present)
#         if response_text.startswith('```json'):
#             response_text = response_text[7:-3].strip()
#         elif response_text.startswith('```'):
#             response_text = response_text[3:-3].strip()

#         # Parse JSON response
#         try:
#             listing_data = json.loads(response_text)
#         except json.JSONDecodeError:
#             # Fallback if JSON parsing fails
#             listing_data = create_fallback_product_listing(transcription)

#         # Validate and clean the data
#         listing_data = validate_art_listing_data(listing_data)

#         return listing_data

#     except Exception as e:
#         print(f"Error generating art listing with Gemini: {str(e)}")
#         # Return fallback listing
#         return create_fallback_product_listing(transcription)

# def create_fallback_product_listing(transcription: str) -> Dict[str, Any]:
#     """
#     Create a basic product listing when AI generation fails.
#     """
#     return {
#         "title": "Unique Handmade Item",
#         "description": f"Beautiful handcrafted item created with care and attention to detail. {transcription}",
#         "tags": ["Handmade", "Unique", "Creative", "Artisan", "Custom"],
#         "category": "Crafts",
#         "suggestedPrice": "₹299",
#         "story": f"This piece represents the creator's passion for handmade craftsmanship. {transcription[:100]}...",
#         "features": [], # Added fallback
#         "specifications": {}, # Added fallback
#         "inStock": True, # Added fallback
#         "stockCount": 10, # Added fallback
#         "shippingInfo": { # Added fallback
#             "estimatedDays": "3-5 business days",
#             "returnPolicy": "30-day returns"
#         },
#         "reviews": [], # Added fallback
#         "generated_at": "2025-07-13",
#         "ai_generated": True,
#         "transcription_source": transcription,
#         "fallback_used": True
#     }

# def validate_art_listing_data(listing_data: Dict[str, Any]) -> Dict[str, Any]:
#     """
#     Validate and clean the generated product listing data according to the Listing model.
#     """
#     # Required fields from the Listing model (expanded)
#     required_fields = [
#         "title", "description", "tags", "category", "suggestedPrice", "story",
#         "features", "specifications", "inStock", "stockCount", "shippingInfo", "reviews"
#     ]

#     for field in required_fields:
#         if field not in listing_data or listing_data[field] is None:
#             if field == "tags":
#                 listing_data[field] = ["Handmade", "Unique"]
#             elif field == "title":
#                 listing_data[field] = "Unique Handmade Item"
#             elif field == "description":
#                 listing_data[field] = "Beautiful handcrafted item with attention to detail"
#             elif field == "category":
#                 listing_data[field] = "Crafts"
#             elif field == "suggestedPrice":
#                 listing_data[field] = "₹299"
#             elif field == "story":
#                 listing_data[field] = "This piece represents the creator's passion for handmade craftsmanship"
#             elif field == "features": # Added validation for new fields
#                 listing_data[field] = []
#             elif field == "specifications": # Added validation for new fields
#                 listing_data[field] = {}
#             elif field == "inStock": # Added validation for new fields
#                 listing_data[field] = True
#             elif field == "stockCount": # Added validation for new fields
#                 listing_data[field] = 10
#             elif field == "shippingInfo": # Added validation for new fields
#                 listing_data[field] = {"estimatedDays": "3-5 business days", "returnPolicy": "30-day returns"}
#             elif field == "reviews": # Added validation for new fields
#                 listing_data[field] = []

#     # Ensure tags is a list
#     if not isinstance(listing_data["tags"], list):
#         listing_data["tags"] = ["Handmade", "Unique"]
#     # Limit tags to reasonable number
#     if len(listing_data["tags"]) > 10:
#         listing_data["tags"] = listing_data["tags"][:10]

#     # Ensure all fields are strings except tags, features, specifications, inStock, stockCount, shippingInfo, reviews
#     string_fields = ["title", "description", "category", "suggestedPrice", "story"]
#     for field in string_fields:
#         if not isinstance(listing_data[field], str):
#             listing_data[field] = str(listing_data[field])

#     # Ensure features is a list of strings
#     if not isinstance(listing_data["features"], list):
#         listing_data["features"] = []
#     listing_data["features"] = [str(f) for f in listing_data["features"] if isinstance(f, (str, int, float, bool))]

#     # Ensure specifications is a dictionary with string values
#     if not isinstance(listing_data["specifications"], dict):
#         listing_data["specifications"] = {}
#     listing_data["specifications"] = {k: str(v) for k, v in listing_data["specifications"].items()}

#     # Ensure inStock is boolean
#     if not isinstance(listing_data["inStock"], bool):
#         listing_data["inStock"] = True # Default to True

#     # Ensure stockCount is integer
#     if not isinstance(listing_data["stockCount"], int):
#         try:
#             listing_data["stockCount"] = int(listing_data["stockCount"])
#         except (ValueError, TypeError):
#             listing_data["stockCount"] = 10 # Default

#     # Ensure shippingInfo is a dictionary
#     if not isinstance(listing_data["shippingInfo"], dict):
#         listing_data["shippingInfo"] = {"estimatedDays": "N/A", "returnPolicy": "N/A"}

#     # Ensure reviews is a list
#     if not isinstance(listing_data["reviews"], list):
#         listing_data["reviews"] = []

#     return listing_data

# def get_art_category_suggestions() -> List[str]:
#     """
#     Return all creative product categories for reference.
#     """
#     return [
#         # Art Categories
#         "Painting", "Drawing", "Sculpture", "Digital Art", "Photography",
#         "Mixed Media", "Printmaking", "Abstract Art", "Figurative Art",
#         "Landscape", "Portrait", "Still Life",

#         # Crafts Categories
#         "Handmade Items", "DIY Projects", "Woodworking", "Pottery",
#         "Ceramics", "Paper Crafts", "Leather Goods", "Candles",
#         "Soap Making", "Embroidery", "Knitting", "Crochet",

#         # Jewelry Categories
#         "Necklaces", "Earrings", "Bracelets", "Rings", "Brooches",
#         "Custom Jewelry", "Beaded Jewelry", "Wire Jewelry", "Pendant",
#         "Charm Jewelry", "Statement Jewelry",

#         # Clothing Categories
#         "Handmade Apparel", "Vintage Clothing", "Accessories", "Bags",
#         "Scarves", "Hats", "Shoes", "Dresses", "Tops", "Bottoms",
#         "Outerwear", "Swimwear", "Lingerie",

#         # Home Decor Categories
#         "Wall Art", "Furniture", "Lighting", "Textiles", "Decorative Objects",
#         "Candles", "Vases", "Mirrors", "Clocks", "Pillows", "Throws",
#         "Rugs", "Curtains", "Plants & Planters", "Kitchen Decor",
#         "Bathroom Decor", "Seasonal Decor"
#     ]

# def get_common_art_tags() -> List[str]:
#     """
#     Return common tags for all creative products.
#     """
#     return [
#         # Art tags
#         "acrylic", "oil", "watercolor", "abstract", "contemporary", "modern",
#         "vintage", "canvas", "framed", "original", "print", "colorful",
#         "monochrome", "expressionist", "minimalist", "detailed", "textured",

#         # Craft tags
#         "handmade", "wooden", "ceramic", "pottery", "rustic", "custom",
#         "artisan", "carved", "painted", "glazed", "fired", "thrown",
#         "woven", "embroidered", "knitted", "crocheted", "sewn",

#         # Jewelry tags
#         "sterling silver", "gold", "gold-filled", "rose gold", "gemstone",
#         "beaded", "elegant", "statement", "delicate", "vintage", "bohemian",
#         "minimalist", "layered", "pendant", "charm", "crystal", "pearl",

#         # Clothing tags
#         "cotton", "silk", "linen", "wool", "cashmere", "vintage", "boho",
#         "sustainable", "eco-friendly", "designer", "custom", "tailored",
#         "comfortable", "stylish", "trendy", "classic", "casual", "formal",

#         # Home decor tags
#         "decorative", "functional", "cozy", "elegant", "rustic", "modern",
#         "minimalist", "farmhouse", "industrial", "scandinavian", "bohemian",
#         "vintage", "antique", "repurposed", "upcycled", "seasonal", "holiday",

#         # Universal tags
#         "unique", "creative", "artistic", "quality", "durable", "gift",
#         "collectible", "one-of-a-kind", "limited edition", "handcrafted",
#         "made-to-order", "personalized", "custom-made"
#     ]






import google.generativeai as genai
import os
import json
from typing import List, Dict, Any
from fastapi import UploadFile # Keep for type hinting in create_listing, but not used directly in this function
import asyncio
from PIL import Image
import io
from models.listingModel import Listing # Assuming Listing model defines these fields

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Modified function signature to accept List[bytes] for images
async def generate_listing_with_gemini(transcription: str, image_bytes_list: List[bytes]) -> Dict[str, Any]:
    """
    Generate a creative product listing using Google Gemini AI based on transcription and product images (as bytes).

    Args:
        transcription: Voice transcription of product description by the creator
        image_bytes_list: List of product image contents as bytes

    Returns:
        Dictionary containing generated listing data matching the Listing model
    """
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Process images for Gemini
        processed_images = []
        for img_content in image_bytes_list: # Iterate through bytes content directly
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(img_content))

            # Resize if too large (Gemini has size limits)
            if pil_image.size[0] > 1024 or pil_image.size[1] > 1024:
                pil_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

            processed_images.append(pil_image)

        # Create the prompt for creative product listings
        prompt = f"""
        You are a professional product curator and listing specialist for creative handmade items. Based on the following creator's voice transcription and product images, create a compelling listing for an online creative marketplace in India.
        Creator's Transcription: "{transcription}"
        Please analyze the product images and transcription to generate a JSON response with the following EXACT structure:
        {{
            "title": "Compelling product title",
            "description": "Detailed product description (150-250 words) including materials, craftsmanship, features, and appeal",
            "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
            "category": "Art/Crafts/Jewelry/Clothing/Home & Decor/etc.",
            "suggestedPrice": "₹XXX",
            "story": "Creator's story and inspiration behind the piece (100-150 words)",
            "features": ["feature1", "feature2", "feature3"],
            "specifications": {{
                "Dimension": "X cm x Y cm",
                "Weight": "Z kg",
                "Material": "Type of material",
                "Color": "Dominant color"
            }},
            "inStock": true,
            "stockCount": 10,
            "shippingInfo": {{
                "estimatedDays": "3-5 business days",
                "returnPolicy": "30-day returns"
            }},
            "reviews": []
        }}
        Guidelines for creative product listings:
        - Title should be descriptive and appealing to Indian buyers
        - Description should highlight materials, craftsmanship, quality, and unique features
        - Tags should include: materials, style, colors, occasion, function, and relevant keywords (use proper case)
        - Category should match the product type accurately (use "Home & Decor" for home decor items)
        - Price should be in Indian Rupees (₹) and reasonable based on materials, time invested, and Indian market value
        - Story should be personal and connect with potential buyers
        - Features should be a list of key selling points.
        - Specifications should be a dictionary of important product attributes.
        - `inStock` should be a boolean (true/false).
        - `stockCount` should be an integer representing available quantity.
        - `shippingInfo` should include estimated delivery days and return policy.
        - `reviews` should be an empty array initially, as reviews are added by users.
        - Make it appealing to people looking for unique, handmade items
        - Extract materials, techniques, and inspiration from transcription and images
        - If the creator mentions their background or inspiration, include it in the story
        - Consider Indian cultural context and traditional craftsmanship
        - Ensure the response is valid JSON
        Product Categories:
        - Art: Painting, Drawing, Sculpture, Digital Art, Photography, Mixed Media, Printmaking
        - Crafts: Handmade Items, DIY Projects, Woodworking, Pottery, Ceramics, Paper Crafts
        - Jewelry: Necklaces, Earrings, Bracelets, Rings, Brooches, Custom Jewelry
        - Clothing: Handmade Apparel, Vintage Clothing, Accessories, Bags, Scarves
        - Home & Decor: Wall Art, Furniture, Lighting, Textiles, Decorative Objects, Candles, Diyas
        Example tags format (use proper case):
        - Art: ["Acrylic", "Oil", "Watercolor", "Abstract", "Contemporary", "Modern", "Canvas"]
        - Crafts: ["Handmade", "Wooden", "Ceramic", "Pottery", "Rustic", "Artisan", "Traditional"]
        - Jewelry: ["Sterling Silver", "Gold", "Gemstone", "Beaded", "Elegant", "Statement", "Handcrafted"]
        - Clothing: ["Vintage", "Boho", "Handmade", "Cotton", "Silk", "Designer", "Sustainable"]
        - Home & Decor: ["Rustic", "Modern", "Decorative", "Functional", "Cozy", "Elegant", "Traditional"]
        IMPORTANT: Always use ₹ symbol for pricing and format as "₹XXX" (single price, not range)
        """

        # Prepare content for Gemini
        content = [prompt]
        content.extend(processed_images)

        # Generate response
        response = await asyncio.to_thread(model.generate_content, content)

        # Parse the response
        response_text = response.text.strip()

        # Clean up the response (remove markdown formatting if present)
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith('```'):
            response_text = response_text[3:-3].strip()

        # Parse JSON response
        try:
            listing_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            listing_data = create_fallback_product_listing(transcription)

        # Validate and clean the data
        listing_data = validate_art_listing_data(listing_data)

        return listing_data

    except Exception as e:
        print(f"Error generating art listing with Gemini: {str(e)}")
        # Return fallback listing
        return create_fallback_product_listing(transcription)

def create_fallback_product_listing(transcription: str) -> Dict[str, Any]:
    """
    Create a basic product listing when AI generation fails.
    """
    return {
        "title": "Unique Handmade Item",
        "description": f"Beautiful handcrafted item created with care and attention to detail. {transcription}",
        "tags": ["Handmade", "Unique", "Creative", "Artisan", "Custom"],
        "category": "Crafts",
        "suggestedPrice": "₹299",
        "story": f"This piece represents the creator's passion for handmade craftsmanship. {transcription[:100]}...",
        "features": [], # Added fallback
        "specifications": {}, # Added fallback
        "inStock": True, # Added fallback
        "stockCount": 10, # Added fallback
        "shippingInfo": { # Added fallback
            "estimatedDays": "3-5 business days",
            "returnPolicy": "30-day returns"
        },
        "reviews": [], # Added fallback
        "generated_at": "2025-07-13",
        "ai_generated": True,
        "transcription_source": transcription,
        "fallback_used": True
    }

def validate_art_listing_data(listing_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and clean the generated product listing data according to the Listing model.
    """
    # Required fields from the Listing model (expanded)
    required_fields = [
        "title", "description", "tags", "category", "suggestedPrice", "story",
        "features", "specifications", "inStock", "stockCount", "shippingInfo", "reviews"
    ]

    for field in required_fields:
        if field not in listing_data or listing_data[field] is None:
            if field == "tags":
                listing_data[field] = ["Handmade", "Unique"]
            elif field == "title":
                listing_data[field] = "Unique Handmade Item"
            elif field == "description":
                listing_data[field] = "Beautiful handcrafted item with attention to detail"
            elif field == "category":
                listing_data[field] = "Crafts"
            elif field == "suggestedPrice":
                listing_data[field] = "₹299"
            elif field == "story":
                listing_data[field] = "This piece represents the creator's passion for handmade craftsmanship"
            elif field == "features": # Added validation for new fields
                listing_data[field] = []
            elif field == "specifications": # Added validation for new fields
                listing_data[field] = {}
            elif field == "inStock": # Added validation for new fields
                listing_data[field] = True
            elif field == "stockCount": # Added validation for new fields
                listing_data[field] = 10
            elif field == "shippingInfo": # Added validation for new fields
                listing_data[field] = {"estimatedDays": "3-5 business days", "returnPolicy": "30-day returns"}
            elif field == "reviews": # Added validation for new fields
                listing_data[field] = []

    # Ensure tags is a list
    if not isinstance(listing_data["tags"], list):
        listing_data["tags"] = ["Handmade", "Unique"]
    # Limit tags to reasonable number
    if len(listing_data["tags"]) > 10:
        listing_data["tags"] = listing_data["tags"][:10]

    # Ensure all fields are strings except tags, features, specifications, inStock, stockCount, shippingInfo, reviews
    string_fields = ["title", "description", "category", "suggestedPrice", "story"]
    for field in string_fields:
        if not isinstance(listing_data[field], str):
            listing_data[field] = str(listing_data[field])

    # Ensure features is a list of strings
    if not isinstance(listing_data["features"], list):
        listing_data["features"] = []
    listing_data["features"] = [str(f) for f in listing_data["features"] if isinstance(f, (str, int, float, bool))]

    # Ensure specifications is a dictionary with string values
    if not isinstance(listing_data["specifications"], dict):
        listing_data["specifications"] = {}
    listing_data["specifications"] = {k: str(v) for k, v in listing_data["specifications"].items()}

    # Ensure inStock is boolean
    if not isinstance(listing_data["inStock"], bool):
        listing_data["inStock"] = True # Default to True

    # Ensure stockCount is integer
    if not isinstance(listing_data["stockCount"], int):
        try:
            listing_data["stockCount"] = int(listing_data["stockCount"])
        except (ValueError, TypeError):
            listing_data["stockCount"] = 10 # Default

    # Ensure shippingInfo is a dictionary
    if not isinstance(listing_data["shippingInfo"], dict):
        listing_data["shippingInfo"] = {"estimatedDays": "N/A", "returnPolicy": "N/A"}

    # Ensure reviews is a list
    if not isinstance(listing_data["reviews"], list):
        listing_data["reviews"] = []

    return listing_data

def get_art_category_suggestions() -> List[str]:
    """
    Return all creative product categories for reference.
    """
    return [
        # Art Categories
        "Painting", "Drawing", "Sculpture", "Digital Art", "Photography",
        "Mixed Media", "Printmaking", "Abstract Art", "Figurative Art",
        "Landscape", "Portrait", "Still Life",

        # Crafts Categories
        "Handmade Items", "DIY Projects", "Woodworking", "Pottery",
        "Ceramics", "Paper Crafts", "Leather Goods", "Candles",
        "Soap Making", "Embroidery", "Knitting", "Crochet",

        # Jewelry Categories
        "Necklaces", "Earrings", "Bracelets", "Rings", "Brooches",
        "Custom Jewelry", "Beaded Jewelry", "Wire Jewelry", "Pendant",
        "Charm Jewelry", "Statement Jewelry",

        # Clothing Categories
        "Handmade Apparel", "Vintage Clothing", "Accessories", "Bags",
        "Scarves", "Hats", "Shoes", "Dresses", "Tops", "Bottoms",
        "Outerwear", "Swimwear", "Lingerie",

        # Home Decor Categories
        "Wall Art", "Furniture", "Lighting", "Textiles", "Decorative Objects",
        "Candles", "Vases", "Mirrors", "Clocks", "Pillows", "Throws",
        "Rugs", "Curtains", "Plants & Planters", "Kitchen Decor",
        "Bathroom Decor", "Seasonal Decor"
    ]

def get_common_art_tags() -> List[str]:
    """
    Return common tags for all creative products.
    """
    return [
        # Art tags
        "acrylic", "oil", "watercolor", "abstract", "contemporary", "modern",
        "vintage", "canvas", "framed", "original", "print", "colorful",
        "monochrome", "expressionist", "minimalist", "detailed", "textured",

        # Craft tags
        "handmade", "wooden", "ceramic", "pottery", "rustic", "custom",
        "artisan", "carved", "painted", "glazed", "fired", "thrown",
        "woven", "embroidered", "knitted", "crocheted", "sewn",

        # Jewelry tags
        "sterling silver", "gold", "gold-filled", "rose gold", "gemstone",
        "beaded", "elegant", "statement", "delicate", "vintage", "bohemian",
        "minimalist", "layered", "pendant", "charm", "crystal", "pearl",

        # Clothing tags
        "cotton", "silk", "linen", "wool", "cashmere", "vintage", "boho",
        "sustainable", "eco-friendly", "designer", "custom", "tailored",
        "comfortable", "stylish", "trendy", "classic", "casual", "formal",

        # Home decor tags
        "decorative", "functional", "cozy", "elegant", "rustic", "modern",
        "minimalist", "farmhouse", "industrial", "scandinavian", "bohemian",
        "vintage", "antique", "repurposed", "upcycled", "seasonal", "holiday",

        # Universal tags
        "unique", "creative", "artistic", "quality", "durable", "gift",
        "collectible", "one-of-a-kind", "limited edition", "handcrafted",
        "made-to-order", "personalized", "custom-made"
    ]
