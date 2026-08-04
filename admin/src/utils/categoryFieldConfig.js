/**
 * Category-Aware Field Configuration System
 * Maps product categories to their specific form fields.
 *
 * Each category group defines:
 *  - groupLabel: Display name for the section
 *  - unitLabel: Primary measurement unit label
 *  - measurementField: Key for primary measurement (e.g., weight_gm, volume_ml)
 *  - fields: Array of field definitions with key, label, type, options, etc.
 *
 * Field types: text, number, select, multiselect, toggle, tags, textarea, color
 */

// ─── Category Group Identifiers ───
// Maps each category slug to its group name
const CATEGORY_GROUP_MAP = {
  // Clothing & Apparel
  sarees: "clothing",
  lehengas: "clothing",
  kurtas: "clothing",
  clothes: "clothing",
  suits: "clothing",
  dresses: "clothing",
  tops: "clothing",
  "ethnic-wear": "clothing",

  // Cosmetics & Makeup
  cosmetics: "cosmetics",
  makeup: "cosmetics",
  "makeup-cosmetics": "cosmetics",
  foundation: "cosmetics",
  lipstick: "cosmetics",
  eyeshadow: "cosmetics",

  // Hair Care
  shampoo: "haircare",
  conditioner: "haircare",
  "hair-oil": "haircare",
  "hair-care": "haircare",
  "hair-serum": "haircare",

  // Skin Care
  skincare: "skincare",
  "skin-care": "skincare",
  serum: "skincare",
  moisturizer: "skincare",
  "face-wash": "skincare",
  sunscreen: "skincare",

  // Fragrances
  perfume: "fragrance",
  deodorant: "fragrance",
  fragrance: "fragrance",
  "body-mist": "fragrance",

  // Jewelry
  jewelry: "jewelry",
  jewellery: "jewelry",
  necklace: "jewelry",
  earrings: "jewelry",
  bracelet: "jewelry",
  rings: "jewelry",
  bangles: "jewelry",

  // Shoes & Footwear
  shoes: "footwear",
  footwear: "footwear",
  sneakers: "footwear",
  heels: "footwear",
  sandals: "footwear",
  "shoes-sneakers": "footwear",

  // Bags & Accessories
  bags: "bags",
  accessories: "bags",
  "bags-accessories": "bags",
  handbags: "bags",
  clutch: "bags",
  wallet: "bags",
};

// ─── Field Definitions Per Category Group ───
const CATEGORY_FIELDS = {
  clothing: {
    groupLabel: "Clothing & Apparel Specifications",
    unitLabel: "Sizes",
    icon: "👗",
    fields: [
      {
        key: "fabric",
        label: "Fabric / Material",
        type: "select",
        options: ["Silk", "Cotton", "Linen", "Georgette", "Chiffon", "Velvet", "Satin", "Polyester", "Rayon", "Crepe", "Net", "Organza", "Denim", "Wool", "Khadi", "Banarasi Silk", "Kanjivaram Silk", "Chanderi", "Tussar Silk", "Other"],
        required: true,
        placeholder: "Select fabric type"
      },
      {
        key: "weave",
        label: "Weave / Work Type",
        type: "select",
        options: ["Handloom", "Zari", "Embroidery", "Block Print", "Bandhani", "Ikat", "Kalamkari", "Chikankari", "Mirror Work", "Sequin", "Thread Work", "Digital Print", "Plain", "Other"],
        placeholder: "Select weave/work type"
      },
      {
        key: "occasion",
        label: "Occasion",
        type: "multiselect",
        options: ["Casual", "Festive", "Wedding", "Party", "Office/Formal", "Daily Wear", "Bridal", "Sangeet", "Haldi", "Mehendi", "Reception"],
      },
      {
        key: "fit",
        label: "Fit Type",
        type: "select",
        options: ["Regular", "Slim", "Relaxed", "Oversized", "True to Size", "A-Line", "Flared"],
        placeholder: "Select fit"
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Women", "Men", "Unisex", "Kids - Girls", "Kids - Boys"],
        required: true,
      },
      {
        key: "sleeve",
        label: "Sleeve Length",
        type: "select",
        options: ["Full Sleeve", "Half Sleeve", "3/4th Sleeve", "Sleeveless", "Cap Sleeve", "N/A"],
      },
      {
        key: "length",
        label: "Garment Length",
        type: "select",
        options: ["Ankle Length", "Knee Length", "Floor Length", "Calf Length", "Mini", "Midi", "Maxi", "Hip Length"],
      },
      {
        key: "care_instructions",
        label: "Care Instructions",
        type: "textarea",
        placeholder: "e.g., Dry clean only. Do not bleach. Iron on low heat.",
      },
      {
        key: "sizes_available",
        label: "Available Sizes",
        type: "multiselect",
        options: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size", "Custom"],
        required: true,
      },
      {
        key: "colors_available",
        label: "Available Colors",
        type: "tags",
        placeholder: "Type color name and press Enter (e.g., Royal Maroon, Navy Blue)"
      }
    ]
  },

  cosmetics: {
    groupLabel: "Cosmetics & Makeup Specifications",
    unitLabel: "Weight (gm)",
    icon: "💄",
    fields: [
      {
        key: "weight_gm",
        label: "Net Weight",
        type: "number",
        unit: "gm",
        required: true,
        placeholder: "e.g., 50"
      },
      {
        key: "skin_type",
        label: "Suitable Skin Type",
        type: "multiselect",
        options: ["Oily", "Dry", "Normal", "Combination", "Sensitive", "All Skin Types"],
        required: true,
      },
      {
        key: "finish_type",
        label: "Finish Type",
        type: "select",
        options: ["Matte", "Glossy", "Satin", "Dewy", "Semi-Matte", "Shimmer", "Metallic", "Natural"],
        placeholder: "Select finish"
      },
      {
        key: "shade_name",
        label: "Shade / Color Name",
        type: "text",
        placeholder: "e.g., Rose Nude, Crimson Red"
      },
      {
        key: "shade_hex",
        label: "Shade Color Code",
        type: "color",
        placeholder: "#B8956A"
      },
      {
        key: "ingredients",
        label: "Key Ingredients",
        type: "tags",
        placeholder: "Type ingredient and press Enter (e.g., Vitamin E, Hyaluronic Acid)"
      },
      {
        key: "expiry_months",
        label: "Shelf Life After Opening",
        type: "number",
        unit: "months",
        placeholder: "e.g., 12"
      },
      {
        key: "spf",
        label: "SPF Value",
        type: "select",
        options: ["None", "SPF 15", "SPF 20", "SPF 25", "SPF 30", "SPF 40", "SPF 50", "SPF 50+"],
      },
      {
        key: "is_cruelty_free",
        label: "Cruelty-Free",
        type: "toggle",
      },
      {
        key: "is_vegan",
        label: "Vegan Formula",
        type: "toggle",
      },
      {
        key: "application_area",
        label: "Application Area",
        type: "select",
        options: ["Face", "Eyes", "Lips", "Cheeks", "Full Face", "Nails", "Brows"],
      },
      {
        key: "coverage",
        label: "Coverage Level",
        type: "select",
        options: ["Sheer", "Light", "Medium", "Full", "Buildable"],
      }
    ]
  },

  haircare: {
    groupLabel: "Hair Care Specifications",
    unitLabel: "Volume (ml)",
    icon: "🧴",
    fields: [
      {
        key: "volume_ml",
        label: "Net Volume",
        type: "number",
        unit: "ml",
        required: true,
        placeholder: "e.g., 250"
      },
      {
        key: "hair_type",
        label: "Suitable Hair Type",
        type: "multiselect",
        options: ["Oily", "Dry", "Normal", "Color-Treated", "Curly", "Frizzy", "Damaged", "Fine", "Thick", "All Hair Types"],
        required: true,
      },
      {
        key: "concern",
        label: "Hair Concern",
        type: "multiselect",
        options: ["Dandruff", "Hair Fall", "Frizz Control", "Damage Repair", "Volume", "Shine", "Growth", "Scalp Care", "Color Protection", "Moisturizing"],
      },
      {
        key: "key_ingredients",
        label: "Key Ingredients",
        type: "tags",
        placeholder: "Type ingredient and press Enter (e.g., Argan Oil, Keratin)"
      },
      {
        key: "usage_instructions",
        label: "Usage Instructions",
        type: "textarea",
        placeholder: "e.g., Apply on wet hair, lather, and rinse. Use 2-3 times a week."
      },
      {
        key: "is_sulfate_free",
        label: "Sulfate-Free",
        type: "toggle",
      },
      {
        key: "is_paraben_free",
        label: "Paraben-Free",
        type: "toggle",
      },
      {
        key: "fragrance",
        label: "Fragrance",
        type: "text",
        placeholder: "e.g., Lavender, Citrus Fresh"
      },
      {
        key: "expiry_months",
        label: "Shelf Life",
        type: "number",
        unit: "months",
        placeholder: "e.g., 24"
      }
    ]
  },

  skincare: {
    groupLabel: "Skin Care Specifications",
    unitLabel: "Volume / Weight",
    icon: "✨",
    fields: [
      {
        key: "volume_ml",
        label: "Net Volume / Weight",
        type: "number",
        unit: "ml/gm",
        required: true,
        placeholder: "e.g., 30"
      },
      {
        key: "product_form",
        label: "Product Form",
        type: "select",
        options: ["Cream", "Gel", "Serum", "Lotion", "Oil", "Foam", "Mist", "Sheet Mask", "Balm", "Toner", "Essence"],
        required: true,
      },
      {
        key: "skin_type",
        label: "Suitable Skin Type",
        type: "multiselect",
        options: ["Oily", "Dry", "Normal", "Combination", "Sensitive", "Acne-Prone", "Mature", "All Skin Types"],
        required: true,
      },
      {
        key: "skin_concern",
        label: "Skin Concern",
        type: "multiselect",
        options: ["Acne", "Dark Spots", "Wrinkles", "Dullness", "Pores", "Redness", "Hydration", "Anti-Aging", "Sun Protection", "Brightening", "Even Tone"],
      },
      {
        key: "active_ingredients",
        label: "Active Ingredients",
        type: "tags",
        placeholder: "Type ingredient and press Enter (e.g., Niacinamide, Retinol, Vitamin C)"
      },
      {
        key: "spf",
        label: "SPF Value",
        type: "select",
        options: ["None", "SPF 15", "SPF 25", "SPF 30", "SPF 40", "SPF 50", "SPF 50+"],
      },
      {
        key: "usage_time",
        label: "Best Used",
        type: "select",
        options: ["Morning (AM)", "Night (PM)", "AM & PM", "Weekly"],
      },
      {
        key: "is_dermatologist_tested",
        label: "Dermatologist Tested",
        type: "toggle",
      },
      {
        key: "is_fragrance_free",
        label: "Fragrance-Free",
        type: "toggle",
      },
      {
        key: "expiry_months",
        label: "Shelf Life After Opening",
        type: "number",
        unit: "months",
        placeholder: "e.g., 12"
      }
    ]
  },

  fragrance: {
    groupLabel: "Fragrance Specifications",
    unitLabel: "Volume (ml)",
    icon: "🌸",
    fields: [
      {
        key: "volume_ml",
        label: "Net Volume",
        type: "number",
        unit: "ml",
        required: true,
        placeholder: "e.g., 100"
      },
      {
        key: "concentration",
        label: "Concentration Type",
        type: "select",
        options: ["Eau de Parfum (EDP)", "Eau de Toilette (EDT)", "Eau de Cologne (EDC)", "Parfum (Extrait)", "Body Mist", "Deodorant"],
        required: true,
      },
      {
        key: "fragrance_family",
        label: "Fragrance Family",
        type: "select",
        options: ["Floral", "Woody", "Oriental/Spicy", "Fresh/Aquatic", "Citrus", "Gourmand", "Musk", "Amber", "Green", "Fruity"],
        required: true,
      },
      {
        key: "top_notes",
        label: "Top Notes",
        type: "tags",
        placeholder: "e.g., Bergamot, Pink Pepper, Lemon"
      },
      {
        key: "middle_notes",
        label: "Middle / Heart Notes",
        type: "tags",
        placeholder: "e.g., Jasmine, Rose, Peony"
      },
      {
        key: "base_notes",
        label: "Base Notes",
        type: "tags",
        placeholder: "e.g., Sandalwood, Musk, Vanilla"
      },
      {
        key: "longevity",
        label: "Longevity",
        type: "select",
        options: ["2-4 Hours", "4-6 Hours", "6-8 Hours", "8-12 Hours", "12+ Hours", "All Day"],
      },
      {
        key: "sillage",
        label: "Sillage (Projection)",
        type: "select",
        options: ["Intimate (Close)", "Moderate", "Strong", "Beast Mode"],
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Women", "Men", "Unisex"],
      },
      {
        key: "season",
        label: "Best Season",
        type: "multiselect",
        options: ["Summer", "Winter", "Spring", "Autumn", "All Season"],
      }
    ]
  },

  jewelry: {
    groupLabel: "Jewelry Specifications",
    unitLabel: "Weight (gm)",
    icon: "💎",
    fields: [
      {
        key: "material",
        label: "Primary Material",
        type: "select",
        options: ["Gold", "Silver", "Platinum", "Rose Gold", "Sterling Silver (925)", "Gold Plated", "Brass", "Copper", "Stainless Steel", "Kundan", "Meenakari", "Temple", "Oxidized Silver", "Artificial/Imitation"],
        required: true,
      },
      {
        key: "purity",
        label: "Purity / Karat",
        type: "select",
        options: ["24K (99.9%)", "22K (91.6%)", "18K (75%)", "14K (58.3%)", "Sterling 925", "Gold Plated", "N/A"],
      },
      {
        key: "weight_gm",
        label: "Net Weight",
        type: "number",
        unit: "gm",
        required: true,
        placeholder: "e.g., 8.5"
      },
      {
        key: "stone_type",
        label: "Stone / Gem Type",
        type: "multiselect",
        options: ["Diamond", "Ruby", "Emerald", "Sapphire", "Pearl", "Zircon", "CZ (Cubic Zirconia)", "Kundan", "Polki", "Amethyst", "Topaz", "Garnet", "None"],
      },
      {
        key: "certification",
        label: "Certification",
        type: "select",
        options: ["BIS Hallmark", "IGI Certified", "GIA Certified", "SGL Certified", "None"],
      },
      {
        key: "jewelry_type",
        label: "Jewelry Type",
        type: "select",
        options: ["Necklace", "Earrings", "Ring", "Bracelet", "Bangle", "Anklet", "Pendant", "Mangalsutra", "Nose Pin", "Maang Tikka", "Set/Combo"],
      },
      {
        key: "clasp_type",
        label: "Clasp / Closure",
        type: "select",
        options: ["Lobster Claw", "Spring Ring", "Push Back", "Screw Back", "Hook", "Adjustable", "Open Bangle", "Toggle", "N/A"],
      },
      {
        key: "is_adjustable",
        label: "Adjustable Size",
        type: "toggle",
      },
      {
        key: "care_instructions",
        label: "Care Instructions",
        type: "textarea",
        placeholder: "e.g., Keep away from water, perfume, and chemicals. Store in airtight pouch."
      }
    ]
  },

  footwear: {
    groupLabel: "Footwear Specifications",
    unitLabel: "Shoe Sizes",
    icon: "👟",
    fields: [
      {
        key: "shoe_sizes",
        label: "Available Sizes (UK)",
        type: "multiselect",
        options: ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12", "UK 13"],
        required: true,
      },
      {
        key: "sole_material",
        label: "Sole Material",
        type: "select",
        options: ["Rubber", "PU (Polyurethane)", "TPR (Thermoplastic Rubber)", "EVA", "Leather", "Cork", "Phylon", "Crepe"],
        required: true,
      },
      {
        key: "upper_material",
        label: "Upper Material",
        type: "select",
        options: ["Genuine Leather", "Synthetic Leather", "Canvas", "Mesh/Knit", "Suede", "Fabric", "PU Leather", "Patent Leather", "Denim", "Jute"],
        required: true,
      },
      {
        key: "closure_type",
        label: "Closure Type",
        type: "select",
        options: ["Lace-Up", "Slip-On", "Velcro", "Buckle", "Zipper", "Strap", "Elastic", "Open"],
      },
      {
        key: "heel_height",
        label: "Heel Height",
        type: "select",
        options: ["Flat (0-1 cm)", "Low (1-3 cm)", "Medium (3-6 cm)", "High (6-9 cm)", "Very High (9+ cm)", "Platform", "Wedge", "N/A"],
      },
      {
        key: "toe_type",
        label: "Toe Shape",
        type: "select",
        options: ["Round", "Pointed", "Square", "Open Toe", "Peep Toe", "Almond", "N/A"],
      },
      {
        key: "shoe_type",
        label: "Shoe Type",
        type: "select",
        options: ["Sneakers", "Heels", "Flats", "Sandals", "Boots", "Loafers", "Mules", "Wedges", "Sports Shoes", "Kolhapuri", "Juttis", "Mojaris"],
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Women", "Men", "Unisex", "Kids"],
      },
      {
        key: "occasion",
        label: "Occasion",
        type: "multiselect",
        options: ["Casual", "Formal", "Party", "Sports", "Wedding", "Daily Wear", "Outdoor/Hiking"],
      },
      {
        key: "is_waterproof",
        label: "Waterproof",
        type: "toggle",
      }
    ]
  },

  bags: {
    groupLabel: "Bags & Accessories Specifications",
    unitLabel: "Dimensions",
    icon: "👜",
    fields: [
      {
        key: "bag_material",
        label: "Material",
        type: "select",
        options: ["Genuine Leather", "Vegan Leather", "Canvas", "Nylon", "PU Leather", "Jute", "Cotton", "Satin", "Straw/Rattan", "Acrylic", "Metal Mesh"],
        required: true,
      },
      {
        key: "length_cm",
        label: "Length",
        type: "number",
        unit: "cm",
        placeholder: "e.g., 30"
      },
      {
        key: "width_cm",
        label: "Width",
        type: "number",
        unit: "cm",
        placeholder: "e.g., 12"
      },
      {
        key: "height_cm",
        label: "Height",
        type: "number",
        unit: "cm",
        placeholder: "e.g., 25"
      },
      {
        key: "bag_type",
        label: "Bag Type",
        type: "select",
        options: ["Tote", "Sling/Crossbody", "Clutch", "Backpack", "Shoulder Bag", "Handbag", "Wallet", "Pouch", "Laptop Bag", "Duffle", "Belt Bag", "Potli"],
      },
      {
        key: "compartments",
        label: "Number of Compartments",
        type: "number",
        placeholder: "e.g., 3"
      },
      {
        key: "closure_type",
        label: "Closure Type",
        type: "select",
        options: ["Zip", "Magnetic Snap", "Flap", "Drawstring", "Clasp", "Open Top", "Turn Lock", "Button"],
      },
      {
        key: "strap_type",
        label: "Strap Type",
        type: "select",
        options: ["Detachable", "Adjustable", "Fixed", "Chain", "None"],
      },
      {
        key: "is_water_resistant",
        label: "Water Resistant",
        type: "toggle",
      },
      {
        key: "occasion",
        label: "Occasion",
        type: "multiselect",
        options: ["Casual", "Party", "Office/Formal", "Travel", "Daily Use", "Wedding"],
      }
    ]
  }
};

/**
 * Get the field configuration for a given category slug.
 * Returns the matching category group fields, or null for unrecognized categories.
 */
export function getCategoryFields(categorySlug) {
  if (!categorySlug) return null;
  const slug = categorySlug.toLowerCase().trim();
  const groupKey = CATEGORY_GROUP_MAP[slug];
  if (!groupKey) return null;
  return CATEGORY_FIELDS[groupKey] || null;
}

/**
 * Get the category group key for a slug.
 */
export function getCategoryGroup(categorySlug) {
  if (!categorySlug) return null;
  return CATEGORY_GROUP_MAP[categorySlug.toLowerCase().trim()] || null;
}

/**
 * Get default return policy based on category.
 * Cosmetics and intimate items are typically non-returnable.
 */
export function getDefaultReturnPolicy(categorySlug) {
  const group = getCategoryGroup(categorySlug);
  if (group === "cosmetics" || group === "skincare" || group === "haircare" || group === "fragrance") {
    return {
      is_returnable: false,
      return_window_days: 0,
      exchange_only: false,
      conditions: "Non-returnable due to hygiene and safety regulations.",
      non_returnable_reason: "Cosmetics, skincare, haircare, and fragrance products cannot be returned once opened."
    };
  }
  if (group === "jewelry") {
    return {
      is_returnable: true,
      return_window_days: 7,
      exchange_only: false,
      conditions: "Must be returned in original packaging with tags and certification intact. No signs of wear.",
      non_returnable_reason: null
    };
  }
  return {
    is_returnable: true,
    return_window_days: 15,
    exchange_only: false,
    conditions: "Unused with original tags intact. No washing, alteration, or damage.",
    non_returnable_reason: null
  };
}

/**
 * Get all available category groups for display.
 */
export function getAllCategoryGroups() {
  return Object.entries(CATEGORY_FIELDS).map(([key, val]) => ({
    key,
    label: val.groupLabel,
    icon: val.icon,
    fieldCount: val.fields.length,
  }));
}

export { CATEGORY_GROUP_MAP, CATEGORY_FIELDS };
