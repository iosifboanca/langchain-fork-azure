import { BaseOutputParser } from "../schema/output_parser.js";
/**
 * Class to combine multiple output parsers
 * @augments BaseOutputParser
 */
export class CombiningOutputParser extends BaseOutputParser {
    constructor(...parsers) {
        super();
        Object.defineProperty(this, "parsers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.parsers = parsers;
    }
    async parse(input, callbacks) {
        const ret = {};
        for (const p of this.parsers) {
            Object.assign(ret, await p.parse(input, callbacks));
        }
        return ret;
    }
    getFormatInstructions() {
        const initial = `For your first output: ${this?.parsers?.[0]?.getFormatInstructions()}`;
        const subsequent = this.parsers
            .slice(1)
            .map((p) => `Complete that output fully. Then produce another output: ${p.getFormatInstructions()}`)
            .join("\n");
        return `${initial}\n${subsequent}`;
    }
}
