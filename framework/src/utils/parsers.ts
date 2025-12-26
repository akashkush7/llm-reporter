import { createReadStream } from "fs";
import { readFile } from "fs/promises";
import { parse } from "csv-parse";
import { parseString } from "xml2js";
import { pipeline } from "stream/promises";
import { Transform } from "stream";

/**
 * CSV Parser - Stream-based for better performance
 */
export class CSVParser {
  /**
   * Parse CSV file as stream and return all records
   * @param filePath Path to CSV file
   * @param options csv-parse options
   * @returns Promise with array of records
   */
  static async read(filePath: string, options?: any): Promise<any[]> {
    const records: any[] = [];

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      ...options,
    });

    await pipeline(
      createReadStream(filePath, { encoding: "utf-8" }),
      parser,
      new Transform({
        objectMode: true,
        transform(record, encoding, callback) {
          records.push(record);
          callback();
        },
      })
    );

    return records;
  }

  /**
   * Parse CSV file as stream and process records one by one
   * Useful for large files to avoid memory issues
   * @param filePath Path to CSV file
   * @param onRecord Callback for each record
   * @param options csv-parse options
   */
  static async readStream(
    filePath: string,
    onRecord: (record: any) => void | Promise<void>,
    options?: any
  ): Promise<void> {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      ...options,
    });

    await pipeline(
      createReadStream(filePath, { encoding: "utf-8" }),
      parser,
      new Transform({
        objectMode: true,
        async transform(record, encoding, callback) {
          try {
            await onRecord(record);
            callback();
          } catch (err: any) {
            callback(err);
          }
        },
      })
    );
  }

  /**
   * Parse CSV with batching for better performance
   * @param filePath Path to CSV file
   * @param batchSize Number of records per batch
   * @param onBatch Callback for each batch
   * @param options csv-parse options
   */
  static async readBatched(
    filePath: string,
    batchSize: number,
    onBatch: (batch: any[]) => void | Promise<void>,
    options?: any
  ): Promise<void> {
    let batch: any[] = [];

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      ...options,
    });

    await pipeline(
      createReadStream(filePath, { encoding: "utf-8" }),
      parser,
      new Transform({
        objectMode: true,
        async transform(record, encoding, callback) {
          try {
            batch.push(record);

            if (batch.length >= batchSize) {
              await onBatch([...batch]);
              batch = [];
            }
            callback();
          } catch (err: any) {
            callback(err);
          }
        },
        async flush(callback) {
          try {
            if (batch.length > 0) {
              await onBatch(batch);
            }
            callback();
          } catch (err: any) {
            callback(err);
          }
        },
      })
    );
  }
}

/**
 * XML Parser - Stream-based for better performance
 */
export class XMLParser {
  /**
   * Parse XML file (uses streaming internally)
   * @param filePath Path to XML file
   * @param options xml2js options
   * @returns Promise with parsed XML object
   */
  static async read(
    filePath: string,
    options?: {
      explicitArray?: boolean;
      mergeAttrs?: boolean;
      trim?: boolean;
    }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let xmlData = "";

      const stream = createReadStream(filePath, { encoding: "utf-8" });

      stream.on("data", (chunk: string | Buffer) => {
        xmlData += typeof chunk === "string" ? chunk : chunk.toString("utf-8");
      });

      stream.on("end", () => {
        parseString(
          xmlData,
          {
            explicitArray: options?.explicitArray ?? true,
            mergeAttrs: options?.mergeAttrs ?? false,
            trim: options?.trim ?? true,
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      stream.on("error", reject);
    });
  }

  /**
   * Parse XML string
   * @param xmlString XML content as string
   * @param options xml2js options
   * @returns Promise with parsed XML object
   */
  static async parseString(xmlString: string, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(xmlString, options, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

/**
 * JSON Parser - Stream-based for better performance
 */
export class JSONParser {
  /**
   * Parse JSON file using fs/promises
   * @param filePath Path to JSON file
   * @returns Promise with parsed JSON object
   */
  static async read(filePath: string): Promise<any> {
    const fileContent = await readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  }

  /**
   * Parse large JSON arrays with streaming
   * Useful for JSON files containing arrays of objects
   * @param filePath Path to JSON file (must contain array at root)
   * @param onItem Callback for each item in array
   */
  static async readArrayStream(
    filePath: string,
    onItem: (item: any) => void | Promise<void>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let buffer = "";
      let depth = 0;
      let inArray = false;
      let currentObject = "";
      let isPaused = false;

      const stream = createReadStream(filePath, { encoding: "utf-8" });

      stream.on("data", (chunk: string | Buffer) => {
        const chunkStr =
          typeof chunk === "string" ? chunk : chunk.toString("utf-8");
        buffer += chunkStr;

        // Process buffer asynchronously
        (async () => {
          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];

            if (char === "[" && depth === 0) {
              inArray = true;
              continue;
            }

            if (!inArray) continue;

            if (char === "{") depth++;
            if (char === "}") depth--;

            if (depth > 0 || char === "{" || char === "}") {
              currentObject += char;
            }

            if (depth === 0 && currentObject.trim()) {
              try {
                const obj = JSON.parse(currentObject);
                if (!isPaused) {
                  isPaused = true;
                  stream.pause();
                  await onItem(obj);
                  isPaused = false;
                  stream.resume();
                }
                currentObject = "";
              } catch (e) {
                // Continue accumulating
              }
            }
          }

          buffer = currentObject;
        })();
      });

      stream.on("end", resolve);
      stream.on("error", reject);
    });
  }
}

/**
 * Auto-detect format and parse with streaming
 */
export class FileParser {
  /**
   * Auto-detect file format and parse
   * @param filePath Path to file
   * @returns Promise with parsed data
   */
  static async read(filePath: string): Promise<any> {
    const ext = filePath.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "csv":
        return CSVParser.read(filePath);
      case "xml":
        return XMLParser.read(filePath);
      case "json":
        return JSONParser.read(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Parse file with custom streaming handler
   * @param filePath Path to file
   * @param onData Callback for each data chunk/record
   * @param options Parser-specific options
   */
  static async readStream(
    filePath: string,
    onData: (data: any) => void | Promise<void>,
    options?: any
  ): Promise<void> {
    const ext = filePath.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "csv":
        return CSVParser.readStream(filePath, onData, options);
      case "json":
        return JSONParser.readArrayStream(filePath, onData);
      default:
        throw new Error(`Streaming not supported for format: ${ext}`);
    }
  }
}
