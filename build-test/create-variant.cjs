"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/use-cases/stock/variants/create-variant.ts
var create_variant_exports = {};
__export(create_variant_exports, {
  CreateVariantUseCase: () => CreateVariantUseCase
});
module.exports = __toCommonJS(create_variant_exports);

// src/@errors/use-cases/bad-request-error.ts
var BadRequestError = class extends Error {
  constructor(message = "Bad request error") {
    super(message);
  }
};

// src/@errors/use-cases/resource-not-found.ts
var ResourceNotFoundError = class extends Error {
  constructor(message = "Resource not found") {
    super(message);
  }
};

// src/entities/domain/unique-entity-id.ts
var import_node_crypto = require("crypto");
var UniqueEntityID = class {
  toString() {
    return this.value;
  }
  toValue() {
    return this.value;
  }
  constructor(value) {
    this.value = value ?? (0, import_node_crypto.randomUUID)();
  }
  equals(id) {
    return id.toValue() === this.value;
  }
};

// src/use-cases/stock/variants/create-variant.ts
var CreateVariantUseCase = class {
  constructor(variantsRepository, productsRepository, templatesRepository) {
    this.variantsRepository = variantsRepository;
    this.productsRepository = productsRepository;
    this.templatesRepository = templatesRepository;
  }
  generateSKUFromName(name) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toUpperCase().substring(0, 50);
  }
  async generateUniqueSKU(baseSKU) {
    let sku = baseSKU;
    let counter = 1;
    while (await this.variantsRepository.findBySKU(sku)) {
      sku = `${baseSKU}-${counter}`;
      counter++;
      if (sku.length > 64) {
        const maxBaseLength = 64 - `-${counter}`.length;
        sku = `${baseSKU.substring(0, maxBaseLength)}-${counter}`;
      }
    }
    return sku;
  }
  async execute(input) {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError("Name is required");
    }
    if (input.name.length > 256) {
      throw new BadRequestError("Name must not exceed 256 characters");
    }
    let sku = input.sku;
    if (!sku || sku.trim().length === 0) {
      const baseSKU = this.generateSKUFromName(input.name);
      sku = await this.generateUniqueSKU(baseSKU);
    }
    if (sku.length > 64) {
      throw new BadRequestError("SKU must not exceed 64 characters");
    }
    const price = input.price ?? 0;
    if (price < 0) {
      throw new BadRequestError("Price cannot be negative");
    }
    if (input.profitMargin !== void 0 && (input.profitMargin < 0 || input.profitMargin > 100)) {
      throw new BadRequestError("Profit margin must be between 0 and 100");
    }
    if (input.costPrice !== void 0 && input.costPrice < 0) {
      throw new BadRequestError("Cost price cannot be negative");
    }
    if (input.minStock !== void 0 && input.minStock < 0) {
      throw new BadRequestError("Min stock cannot be negative");
    }
    if (input.maxStock !== void 0 && input.maxStock < 0) {
      throw new BadRequestError("Max stock cannot be negative");
    }
    if (input.minStock !== void 0 && input.maxStock !== void 0 && input.minStock > input.maxStock) {
      throw new BadRequestError("Min stock cannot be greater than max stock");
    }
    if (input.reorderPoint !== void 0 && input.reorderPoint < 0) {
      throw new BadRequestError("Reorder point cannot be negative");
    }
    if (input.reorderQuantity !== void 0 && input.reorderQuantity < 0) {
      throw new BadRequestError("Reorder quantity cannot be negative");
    }
    if (input.imageUrl && input.imageUrl.length > 512) {
      throw new BadRequestError("Image URL must not exceed 512 characters");
    }
    if (input.barcode && input.barcode.length > 128) {
      throw new BadRequestError("Barcode must not exceed 128 characters");
    }
    if (input.eanCode && input.eanCode.length > 13) {
      throw new BadRequestError("EAN code must not exceed 13 characters");
    }
    if (input.upcCode && input.upcCode.length > 12) {
      throw new BadRequestError("UPC code must not exceed 12 characters");
    }
    if (input.qrCode && input.qrCode.length > 512) {
      throw new BadRequestError("QR code must not exceed 512 characters");
    }
    const productId = new UniqueEntityID(input.productId);
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new ResourceNotFoundError("Product not found");
    }
    if (input.sku) {
      const existingVariantBySKU = await this.variantsRepository.findBySKU(sku);
      if (existingVariantBySKU) {
        throw new BadRequestError("SKU already exists");
      }
    }
    if (input.barcode) {
      const existingVariantByBarcode = await this.variantsRepository.findByBarcode(input.barcode);
      if (existingVariantByBarcode) {
        throw new BadRequestError("Barcode already exists");
      }
    }
    if (input.eanCode) {
      const existingVariantByEANCode = await this.variantsRepository.findByEANCode(input.eanCode);
      if (existingVariantByEANCode) {
        throw new BadRequestError("EAN code already exists");
      }
    }
    if (input.upcCode) {
      const existingVariantByUPCCode = await this.variantsRepository.findByUPCCode(input.upcCode);
      if (existingVariantByUPCCode) {
        throw new BadRequestError("UPC code already exists");
      }
    }
    if (input.attributes) {
      const template = await this.templatesRepository.findById(
        product.templateId
      );
      if (template && template.variantAttributes) {
        const allowedKeys = Object.keys(template.variantAttributes);
        const providedKeys = Object.keys(input.attributes);
        const invalidKeys = providedKeys.filter(
          (key) => !allowedKeys.includes(key)
        );
        if (invalidKeys.length > 0) {
          throw new BadRequestError(
            `Invalid attribute keys: ${invalidKeys.join(", ")}. Allowed keys: ${allowedKeys.join(", ")}`
          );
        }
      }
    }
    const variant = await this.variantsRepository.create({
      productId,
      sku,
      name: input.name,
      price,
      imageUrl: input.imageUrl,
      attributes: input.attributes ?? {},
      costPrice: input.costPrice,
      profitMargin: input.profitMargin,
      barcode: input.barcode,
      qrCode: input.qrCode,
      eanCode: input.eanCode,
      upcCode: input.upcCode,
      minStock: input.minStock,
      maxStock: input.maxStock,
      reorderPoint: input.reorderPoint,
      reorderQuantity: input.reorderQuantity
    });
    return {
      variant: {
        id: variant.id.toString(),
        productId: variant.productId.toString(),
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        imageUrl: variant.imageUrl,
        attributes: variant.attributes,
        costPrice: variant.costPrice,
        profitMargin: variant.profitMargin,
        barcode: variant.barcode,
        qrCode: variant.qrCode,
        eanCode: variant.eanCode,
        upcCode: variant.upcCode,
        minStock: variant.minStock,
        maxStock: variant.maxStock,
        reorderPoint: variant.reorderPoint,
        reorderQuantity: variant.reorderQuantity,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreateVariantUseCase
});
