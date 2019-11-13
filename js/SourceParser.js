"use strict";


class SourceParserException {
    constructor(msg) {
        this.msg = msg;
    }
}


class FrameDefinition {
    constructor(name, description, transform) {
        this.name = name;
        this.description = description;
        this.transform = transform;
    }
}


class SceneObjectDefinition {
    constructor(name, frame, format, data) {
        this.name = name;
        this.frame = frame;
        this.format = format;
        this.data = data;
    }
}


class SourceParser {

    constructor(sourceText) {
        this._sourceLines = sourceText.split('\n');
        this._lineCursor = 0;
    }

    _ensureAtValidLine() {
        while (this._lineCursor < this._sourceLines.length) {
            const line = this._sourceLines[this._lineCursor];
            if ( line.trim().startsWith('#') || /* comment */
                 line.trim().length === 0 /* empty */ ) {
                ++this._lineCursor;
                continue;
            }
            break;
        }
    }

    _getNextLine() {
        this._ensureAtValidLine();
        if (this._lineCursor === this._sourceLines.length) return null;
        return this._sourceLines[this._lineCursor++].trim();
    }

    _peekNextLine() {
        this._ensureAtValidLine();
        if (this._lineCursor === this._sourceLines.length) return null;
        return this._sourceLines[this._lineCursor].trim();
    }

    _parseKeyValue(expectedKey, valueAsJSON) {
        const line = this._getNextLine();
        const [key, ...val] = line.split(':');
        if (!key || !val) {
            throw new SourceParserException(
                `Expected "key: value" at line ${this._lineCursor}, found:\n${line}`);
        }
        if ((expectedKey !== undefined) && (key !== expectedKey)) {
            throw new SourceParserException(
                `Expected key ${expectedKey}: at line ${this._lineCursor}, found:\n${line}`);
        }

        if (valueAsJSON === true) {
            return [key.slice(0, -1), JSON.parse(val.join(':'))];
        } else {
            return [key.slice(0, -1), val.join(':')];
        }
    }

    _parseFrameDefinition() {
        const line = this._getNextLine()
        const frameName = line.split(' ').filter(x => x)[1];
        const [ , desc] = this._parseKeyValue('description', /*JSON*/ true);
        const [ , xform] = this._parseKeyValue('transform', /*JSON*/ true);
        return new FrameDefinition(frameName, desc, xform);
    }

    _parseObjectDefinition() {
        const line = this._getNextLine()
        const objectName = line.split(' ').filter(x => x)[1];
        const [ , frame] = this._parseKeyValue('frame');
        const [ , format] = this._parseKeyValue('format');
        const supportedFormats = [ 'OBJ', 'BASE64' ];
        if (supportedFormats.indexOf(format.trim()) === -1) {
            throw new SourceParserException(
                `Line ${this._lineCursor}: only ${supportedFormats} formats are supported; found: '${format.trim()}'`);
        }
        const [ , dataDelim] = this._parseKeyValue('data');
        if (dataDelim.trim() != '{') {
            throw new SourceParserException(
                `Expected delimiter '{' at line ${this._lineCursor}, found:\n${dataDelim}`);
        }

        let data = [];
        while(this._sourceLines[this._lineCursor].trim() != '}') {
            data.push(this._sourceLines[this._lineCursor++]);
        }
        ++this._lineCursor;
        data = data.join('\n');

        return new SceneObjectDefinition(objectName, frame.trim(), format.trim(), data);
    }

    parse() {
        const parsedDefintitions = [];

        while (true) {
            const nextLine = this._peekNextLine();
            if (nextLine === null) {
                break;
            }
            if (nextLine.startsWith('FRAME ')) {
                parsedDefintitions.push(this._parseFrameDefinition());
            } else if (nextLine.startsWith('OBJECT')) {
                parsedDefintitions.push(this._parseObjectDefinition());
            } else {
                throw new SourceParserException(
                    `Cannot parse line number ${this._lineCursor}; ` +
                    `was expecting a FRAME or OBJECT definition:\n${nextLine}`);
            }
        }

        return parsedDefintitions;
    }
}


class WavefrontOBJParserException {
    constructor(msg) {
        this.msg = msg;
    }
}


class WavefrontOBJParser {
    constructor(sourceText) {
        this._sourceLines = sourceText.split('\n');
    }

    parse() {
        const vertices = [];
        const mesh = [];

        const sourceLines = this._sourceLines;
        for (let lineNum=0; lineNum < sourceLines.length; ++lineNum) {
            const sourceLine = sourceLines[lineNum].trim();
            if (sourceLine == "" || sourceLine.startsWith("#")) {
                continue;
            }
            else if (sourceLine.startsWith("v")) {
                const fields = sourceLine.split(/\s+/);
                vertices.push(fields.slice(1).map(x => Number(x)));
            }
            else if (sourceLine.startsWith("f")) {
                const fields = sourceLine.split(/\s+/);
                if (fields.length != 4) {
                    throw new WavefrontOBJParserException('Only triangular faces are supported!');
                }
                mesh_vertices.push(
                    ...vertices[fields[1] - 1],
                    ...vertices[fields[2] - 1],
                    ...vertices[fields[3] - 1]
                );
            }
            else {
                throw new WavefrontOBJParserException(`Invalid source line ${lineNum}: ${sourceLine}`);
            }
        }

        return { 'vertices': vertices, 'mesh':  mesh };
    }
}
