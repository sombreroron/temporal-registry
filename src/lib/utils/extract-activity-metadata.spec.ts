import "reflect-metadata";
import { ActivityProperty } from "../decorators/activity-property.decorator";
import { ActivityPropertyOptional } from "../decorators/activity-property-optional.decorator";
import { extractActivityMetadata } from "./extract-activity-metadata";
import { ACTIVITY_INPUT_METADATA, ACTIVITY_OUTPUT_METADATA } from "../temporal-registry.consts";
import type { ActivityOutputMetadata } from "../decorators/activity-output.decorator";

class SimpleDto {
    @ActivityProperty()
    name!: string;

    @ActivityProperty()
    age!: number;
}

class NestedDto {
    @ActivityProperty()
    id!: string;

    @ActivityProperty()
    tags!: string[];
}

class Item {
    @ActivityProperty()
    name!: string;

    @ActivityProperty()
    quantity!: number;
}

class DtoWithTypedArray {
    @ActivityProperty()
    id!: string;

    @ActivityProperty({ type: [Item] })
    items!: Item[];
}

describe("extractActivityMetadata", () => {
    describe("when activity is not a function", () => {
        it("should return empty object for null", () => {
            const result = extractActivityMetadata(null);
            expect(result).toEqual({});
        });

        it("should return empty object for undefined", () => {
            const result = extractActivityMetadata(undefined);
            expect(result).toEqual({});
        });

        it("should return empty object for non-function values", () => {
            expect(extractActivityMetadata("string")).toEqual({});
            expect(extractActivityMetadata(123)).toEqual({});
            expect(extractActivityMetadata({})).toEqual({});
        });
    });

    describe("when activity has no metadata", () => {
        it("should return empty params array when no params metadata exists", () => {
            function testActivity() {
                return "result";
            }

            const result = extractActivityMetadata(testActivity);
            expect(result).toEqual({ input: [] });
        });
    });

    describe("when activity has primitive type input", () => {
        it("should extract string input metadata", () => {
            function testActivity(name: string) {
                return name;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "name", type: String, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input).toHaveLength(1);
            expect(result.input?.[0]).toEqual({
                name: "name",
                type: "String",
                optional: false,
            });
        });

        it("should extract number input metadata", () => {
            function testActivity(count: number) {
                return count;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "count", type: Number, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input?.[0]).toEqual({
                name: "count",
                type: "Number",
                optional: false,
            });
        });

        it("should extract boolean input metadata", () => {
            function testActivity(isActive: boolean) {
                return isActive;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "isActive", type: Boolean, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input?.[0]).toEqual({
                name: "isActive",
                type: "Boolean",
                optional: false,
            });
        });
    });

    describe("when activity has array input parameters", () => {
        it("should extract array of strings input metadata", () => {
            function testActivity(domains: string[]) {
                return domains;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "domains", type: String, optional: false, isArray: true }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input).toHaveLength(1);
            expect(result.input?.[0]).toEqual({
                name: "domains",
                type: {
                    className: "Array",
                    properties: {
                        elementType: { type: "String" },
                    },
                },
                optional: false,
            });
        });

        it("should extract array of numbers input metadata", () => {
            function testActivity(values: number[]) {
                return values;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "values", type: Number, optional: false, isArray: true }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input?.[0]).toEqual({
                name: "values",
                type: {
                    className: "Array",
                    properties: {
                        elementType: { type: "Number" },
                    },
                },
                optional: false,
            });
        });

        it("should extract array of complex objects input metadata", () => {
            function testActivity(items: Item[]) {
                return items;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "items", type: Item, optional: false, isArray: true }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input?.[0]).toEqual({
                name: "items",
                type: {
                    className: "Array",
                    properties: {
                        elementType: {
                            type: "Item",
                            properties: {
                                name: { type: "String" },
                                quantity: { type: "Number" },
                            },
                        },
                    },
                },
                optional: false,
            });
        });

        it("should handle optional array input", () => {
            function testActivity(tags?: string[]) {
                return tags;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "tags", type: String, optional: true, isArray: true }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input?.[0]).toEqual({
                name: "tags",
                type: {
                    className: "Array",
                    properties: {
                        elementType: { type: "String" },
                    },
                },
                optional: true,
            });
        });
    });

    describe("when activity has class/DTO input", () => {
        it("should extract class input with properties", () => {
            function testActivity(dto: SimpleDto) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: SimpleDto, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input?.[0].name).toBe("dto");
            expect(result.input?.[0].type).toHaveProperty("className", "SimpleDto");
            expect(result.input?.[0].type).toHaveProperty("properties");
            expect(result.input?.[0].optional).toBe(false);
        });

        it("should extract type information from class properties", () => {
            function testActivity(dto: SimpleDto) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: SimpleDto, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties).toHaveProperty("name");
            expect(properties).toHaveProperty("age");
            expect(properties?.["name"]).toEqual({ type: "String" });
            expect(properties?.["age"]).toEqual({ type: "Number" });
        });
    });

    describe("when activity has primitive type output", () => {
        it("should extract string output metadata", () => {
            function testActivity() {
                return "output";
            }

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, String, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.properties).toBeUndefined();
        });

        it("should extract number output metadata", () => {
            function testActivity() {
                return 0;
            }

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, Number, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Number");
            expect(result.output?.properties).toBeUndefined();
        });

        it("should extract boolean output metadata", () => {
            function testActivity() {
                return 0;
            }

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, Boolean, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Boolean");
            expect(result.output?.properties).toBeUndefined();
        });
    });

    describe("when activity has enum input", () => {
        it("should extract enum values for string enum", () => {
            enum Priority {
                LOW = "low",
                MEDIUM = "medium",
                HIGH = "high",
            }

            function testActivity(priority: Priority) {
                return priority;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "priority", type: String, optional: false, enum: Object.values(Priority) }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input).toHaveLength(1);
            expect(result.input?.[0]).toEqual({
                name: "priority",
                type: "String",
                optional: false,
                enum: ["low", "medium", "high"],
            });
        });

        it("should extract enum values for numeric enum", () => {
            enum Status {
                PENDING = 0,
                ACTIVE = 1,
                COMPLETED = 2,
            }

            function testActivity(status: Status) {
                return status;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "status", type: Number, optional: false, enum: [0, 1, 2] }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input).toHaveLength(1);
            expect(result.input?.[0]).toEqual({
                name: "status",
                type: "Number",
                optional: false,
                enum: [0, 1, 2],
            });
        });

        it("should extract multiple inputs with mixed enum and non-enum", () => {
            enum Priority {
                LOW = "low",
                HIGH = "high",
            }

            function testActivity(name: string, priority: Priority) {
                return { name, priority };
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [
                    { name: "name", type: String, optional: false },
                    { name: "priority", type: String, optional: false, enum: Object.values(Priority) },
                ],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input).toHaveLength(2);
            expect(result.input?.[0]).toEqual({
                name: "name",
                type: "String",
                optional: false,
            });
            expect(result.input?.[1]).toEqual({
                name: "priority",
                type: "String",
                optional: false,
                enum: ["low", "high"],
            });
        });

        it("should handle optional enum parameter", () => {
            enum Priority {
                LOW = "low",
                HIGH = "high",
            }

            function testActivity(priority?: Priority) {
                return priority;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "priority", type: String, optional: true, enum: Object.values(Priority) }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            expect(result.input).toHaveLength(1);
            expect(result.input?.[0]).toEqual({
                name: "priority",
                type: "String",
                optional: true,
                enum: ["low", "high"],
            });
        });
    });

    describe("when activity has output type metadata", () => {
        it("should extract output type class metadata", () => {
            function testActivity() {
                return new SimpleDto();
            }

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, SimpleDto, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("SimpleDto");
            expect(result.output).toHaveProperty("properties");
        });

        it("should extract types from output type class", () => {
            function testActivity() {
                return new SimpleDto();
            }

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, SimpleDto, testActivity);

            const result = extractActivityMetadata(testActivity);
            const properties = result.output?.properties;

            expect(properties).toHaveProperty("name");
            expect(properties).toHaveProperty("age");
            expect(properties?.["name"]).toEqual({ type: "String" });
            expect(properties?.["age"]).toEqual({ type: "Number" });
        });
    });

    describe("when activity has arrays with element types", () => {
        it("should extract array with complex element type", () => {
            function testActivity(dto: DtoWithTypedArray) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: DtoWithTypedArray, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["id"]).toEqual({ type: "String" });
            expect(properties?.["items"]).toHaveProperty("type", "Array");
            expect(properties?.["items"]).toHaveProperty("elementType");
        });

        it("should recursively extract properties of array element type", () => {
            function testActivity(dto: DtoWithTypedArray) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: DtoWithTypedArray, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const itemsType = result.input?.[0].type.properties?.["items"];

            expect(itemsType?.elementType).toHaveProperty("type", "Item");
            expect(itemsType?.elementType).toHaveProperty("properties");
            expect(itemsType?.elementType?.properties?.["name"]).toEqual({ type: "String" });
            expect(itemsType?.elementType?.properties?.["quantity"]).toEqual({ type: "Number" });
        });

        it("should handle arrays without type parameter", () => {
            class SimpleArrayDto {
                @ActivityProperty()
                tags!: string[];
            }

            Reflect.defineMetadata("design:type", Array, SimpleArrayDto.prototype, "tags");

            function testActivity(dto: SimpleArrayDto) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: SimpleArrayDto, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            // Without type parameter, we just know it's an Array
            expect(properties?.["tags"]).toEqual({ type: "Array" });
            expect(properties?.["tags"]?.elementType).toBeUndefined();
        });

        it("should handle arrays with primitive element types", () => {
            class PrimitiveArrayDto {
                @ActivityProperty({ type: [String] })
                names!: string[];
            }

            function testActivity(dto: PrimitiveArrayDto) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: PrimitiveArrayDto, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["names"]).toEqual({
                type: "Array",
                elementType: { type: "String" },
            });
        });

        it("should support array syntax with brackets [Item]", () => {
            class ArraySyntaxDto {
                @ActivityProperty({ type: [Item] })
                items!: Item[];
            }

            function testActivity(dto: ArraySyntaxDto) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: ArraySyntaxDto, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["items"]).toEqual({
                type: "Array",
                elementType: {
                    type: "Item",
                    properties: {
                        name: { type: "String" },
                        quantity: { type: "Number" },
                    },
                },
            });
        });

        it("should support array syntax with primitive types [String]", () => {
            class ArraySyntaxDto {
                @ActivityProperty({ type: [String] })
                tags!: string[];
            }

            function testActivity(dto: ArraySyntaxDto) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: ArraySyntaxDto, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["tags"]).toEqual({
                type: "Array",
                elementType: { type: "String" },
            });
        });
    });

    describe("when using ActivityPropertyOptional decorator", () => {
        it("should work with optional properties", () => {
            class OptionalDto {
                @ActivityProperty()
                required!: string;

                @ActivityPropertyOptional()
                optional?: string;
            }

            Reflect.defineMetadata("design:type", String, OptionalDto.prototype, "required");
            Reflect.defineMetadata("design:type", String, OptionalDto.prototype, "optional");

            function testActivity(dto: OptionalDto) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: OptionalDto, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["required"]).toEqual({ type: "String" });
            expect(properties?.["optional"]).toEqual({ type: "String", optional: true });
        });

        it("should extract enum from ActivityProperty with primitive type", () => {
            enum Priority {
                LOW = "low",
                MEDIUM = "medium",
                HIGH = "high",
            }

            class DtoWithEnum {
                @ActivityProperty({ enum: Object.values(Priority) })
                priority!: string;
            }

            Reflect.defineMetadata("design:type", String, DtoWithEnum.prototype, "priority");

            function testActivity(dto: DtoWithEnum) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: DtoWithEnum, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["priority"]).toEqual({
                type: "String",
                enum: ["low", "medium", "high"],
            });
        });

        it("should extract enum from ActivityProperty with explicit type", () => {
            enum Status {
                PENDING = 0,
                ACTIVE = 1,
                COMPLETED = 2,
            }

            class DtoWithNumericEnum {
                @ActivityProperty({ type: Number, enum: [0, 1, 2] })
                status!: number;
            }

            function testActivity(dto: DtoWithNumericEnum) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: DtoWithNumericEnum, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["status"]).toEqual({
                type: "Number",
                enum: [0, 1, 2],
            });
        });

        it("should extract enum with optional property", () => {
            enum Priority {
                LOW = "low",
                HIGH = "high",
            }

            class DtoWithOptionalEnum {
                @ActivityProperty({ optional: true, enum: Object.values(Priority) })
                priority?: string;
            }

            Reflect.defineMetadata("design:type", String, DtoWithOptionalEnum.prototype, "priority");

            function testActivity(dto: DtoWithOptionalEnum) {
                return dto;
            }

            Reflect.defineMetadata(
                ACTIVITY_INPUT_METADATA,
                [{ name: "dto", type: DtoWithOptionalEnum, optional: false }],
                testActivity,
            );

            const result = extractActivityMetadata(testActivity);
            const properties = result.input?.[0].type.properties;

            expect(properties?.["priority"]).toEqual({
                type: "String",
                optional: true,
                enum: ["low", "high"],
            });
        });
    });

    describe("when activity has array output type", () => {
        it("should extract array output with primitive element type", () => {
            function testActivity() {
                return ["string1", "string2"];
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                isArray: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Array");
            expect(result.output?.properties).toHaveProperty("elementType");
            expect(result.output?.properties?.["elementType"]).toEqual({ type: "String" });
        });

        it("should extract array output with Number element type", () => {
            function testActivity() {
                return [1, 2, 3];
            }

            const metadata: ActivityOutputMetadata = {
                type: Number,
                isArray: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output?.className).toBe("Array");
            expect(result.output?.properties?.["elementType"]).toEqual({ type: "Number" });
        });

        it("should extract array output with class element type", () => {
            function testActivity() {
                return [new SimpleDto()];
            }

            const metadata: ActivityOutputMetadata = {
                type: SimpleDto,
                isArray: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Array");
            expect(result.output?.properties).toHaveProperty("elementType");
            expect(result.output?.properties?.["elementType"]).toHaveProperty("type", "SimpleDto");
            expect(result.output?.properties?.["elementType"]).toHaveProperty("properties");
        });

        it("should recursively extract properties of array element type", () => {
            function testActivity() {
                return [new SimpleDto()];
            }

            const metadata: ActivityOutputMetadata = {
                type: SimpleDto,
                isArray: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            const elementType = result.output?.properties?.["elementType"];

            expect(elementType?.type).toBe("SimpleDto");
            expect(elementType?.properties).toHaveProperty("name");
            expect(elementType?.properties).toHaveProperty("age");
            expect(elementType?.properties?.["name"]).toEqual({ type: "String" });
            expect(elementType?.properties?.["age"]).toEqual({ type: "Number" });
        });

        it("should extract array output with complex nested class", () => {
            function testActivity() {
                return [new Item()];
            }

            const metadata: ActivityOutputMetadata = {
                type: Item,
                isArray: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            const elementType = result.output?.properties?.["elementType"];

            expect(result.output?.className).toBe("Array");
            expect(elementType?.type).toBe("Item");
            expect(elementType?.properties?.["name"]).toEqual({ type: "String" });
            expect(elementType?.properties?.["quantity"]).toEqual({ type: "Number" });
        });

        it("should support direct array syntax with primitive types", () => {
            function testActivity() {
                return ["tag1", "tag2"];
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                isArray: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output?.className).toBe("Array");
            expect(result.output?.properties?.["elementType"]).toEqual({ type: "String" });
        });

        it("should support direct array syntax with class types", () => {
            function testActivity() {
                return [new Item()];
            }

            const metadata: ActivityOutputMetadata = {
                type: Item,
                isArray: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            const elementType = result.output?.properties?.["elementType"];

            expect(result.output?.className).toBe("Array");
            expect(elementType?.type).toBe("Item");
            expect(elementType?.properties?.["name"]).toEqual({ type: "String" });
            expect(elementType?.properties?.["quantity"]).toEqual({ type: "Number" });
        });
    });

    describe("when activity has nullable output", () => {
        it("should extract nullable flag for primitive type output", () => {
            function testActivity() {
                return "output";
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                nullable: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.nullable).toBe(true);
            expect(result.output?.properties).toBeUndefined();
        });

        it("should extract nullable flag for class type output", () => {
            function testActivity() {
                return new SimpleDto();
            }

            const metadata: ActivityOutputMetadata = {
                type: SimpleDto,
                nullable: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("SimpleDto");
            expect(result.output?.nullable).toBe(true);
            expect(result.output).toHaveProperty("properties");
        });

        it("should extract nullable flag for array output", () => {
            function testActivity() {
                return ["string1", "string2"];
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                isArray: true,
                nullable: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Array");
            expect(result.output?.nullable).toBe(true);
            expect(result.output?.properties).toHaveProperty("elementType");
            expect(result.output?.properties?.["elementType"]).toEqual({ type: "String" });
        });

        it("should not have nullable field when nullable is not set", () => {
            function testActivity() {
                return "output";
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.nullable).toBeUndefined();
        });

        it("should not have nullable field when nullable is undefined", () => {
            function testActivity() {
                return "output";
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                nullable: undefined,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.nullable).toBeUndefined();
        });

        it("should handle nullable with Number type", () => {
            function testActivity() {
                return 42;
            }

            const metadata: ActivityOutputMetadata = {
                type: Number,
                nullable: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Number");
            expect(result.output?.nullable).toBe(true);
        });

        it("should handle nullable with Boolean type", () => {
            function testActivity() {
                return true;
            }

            const metadata: ActivityOutputMetadata = {
                type: Boolean,
                nullable: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Boolean");
            expect(result.output?.nullable).toBe(true);
        });

        it("should handle nullable with nested class properties", () => {
            function testActivity() {
                return new NestedDto();
            }

            const metadata: ActivityOutputMetadata = {
                type: NestedDto,
                nullable: true,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("NestedDto");
            expect(result.output?.nullable).toBe(true);
            expect(result.output?.properties).toHaveProperty("id");
            expect(result.output?.properties).toHaveProperty("tags");
        });
    });

    describe("when activity has enum output", () => {
        it("should extract enum values for string enum output", () => {
            enum Priority {
                LOW = "low",
                MEDIUM = "medium",
                HIGH = "high",
            }

            function testActivity() {
                return Priority.LOW;
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                enum: Object.values(Priority),
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.enum).toEqual(["low", "medium", "high"]);
        });

        it("should extract enum values for numeric enum output", () => {
            enum Status {
                PENDING = 0,
                ACTIVE = 1,
                COMPLETED = 2,
            }

            function testActivity() {
                return Status.PENDING;
            }

            const metadata: ActivityOutputMetadata = {
                type: Number,
                enum: [0, 1, 2],
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Number");
            expect(result.output?.enum).toEqual([0, 1, 2]);
        });

        it("should handle enum with nullable output", () => {
            enum Priority {
                LOW = "low",
                HIGH = "high",
            }

            function testActivity() {
                return Priority.LOW;
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                nullable: true,
                enum: Object.values(Priority),
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.nullable).toBe(true);
            expect(result.output?.enum).toEqual(["low", "high"]);
        });

        it("should handle enum with array output", () => {
            enum Priority {
                LOW = "low",
                HIGH = "high",
            }

            function testActivity() {
                return [Priority.LOW];
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                isArray: true,
                enum: Object.values(Priority),
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Array");
            expect(result.output?.enum).toEqual(["low", "high"]);
            expect(result.output?.properties).toHaveProperty("elementType");
        });

        it("should not have enum field when enum is not set", () => {
            function testActivity() {
                return "output";
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.enum).toBeUndefined();
        });

        it("should handle mixed string and number enum values", () => {
            function testActivity() {
                return "value";
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                enum: ["low", "medium", 1, 2],
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.enum).toEqual(["low", "medium", 1, 2]);
        });

        it("should handle enum with nullable array output", () => {
            enum Status {
                ACTIVE = "active",
                INACTIVE = "inactive",
            }

            function testActivity() {
                return [Status.ACTIVE];
            }

            const metadata: ActivityOutputMetadata = {
                type: String,
                isArray: true,
                nullable: true,
                enum: Object.values(Status),
            };

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("Array");
            expect(result.output?.nullable).toBe(true);
            expect(result.output?.enum).toEqual(["active", "inactive"]);
        });
    });

    describe("backward compatibility with old output metadata format", () => {
        it("should handle old format where metadata is just the type", () => {
            function testActivity() {
                return new SimpleDto();
            }

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, SimpleDto, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("SimpleDto");
            expect(result.output).toHaveProperty("properties");
        });

        it("should handle old format with primitive types", () => {
            function testActivity() {
                return "output";
            }

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, String, testActivity);

            const result = extractActivityMetadata(testActivity);
            expect(result.output).toBeDefined();
            expect(result.output?.className).toBe("String");
            expect(result.output?.properties).toBeUndefined();
        });
    });
});
