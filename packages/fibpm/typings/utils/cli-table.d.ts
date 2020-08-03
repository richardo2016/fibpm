/**
 * @see https://sourcegraph.com/github.com/Automattic/cli-table@master/-/blob/lib/index.js#L6:5
 */
declare type ICliTableConfig = {
    head?: string[];
    chars?: {
        /**
         * @sample '═'
         */
        'top'?: string;
        /**
         * @sample '╤'
         */
        'top-mid'?: string;
        /**
         * @sample '╔'
         */
        'top-left'?: string;
        /**
         * @sample '╗'
         */
        'top-right'?: string;
        /**
         * @sample '═'
         */
        'bottom'?: string;
        /**
         * @sample '╧'
         */
        'bottom-mid'?: string;
        /**
         * @sample '╚'
         */
        'bottom-left'?: string;
        /**
         * @sample '╝'
         */
        'bottom-right'?: string;
        /**
         * @sample '║'
         */
        'left'?: string;
        /**
         * @sample '╟'
         */
        'left-mid'?: string;
        /**
         * @sample '─'
         */
        'mid'?: string;
        /**
         * @sample '┼'
         */
        'mid-mid'?: string;
        /**
         * @sample '║'
         */
        'right'?: string;
        /**
         * @sample '╢'
         */
        'right-mid'?: string;
        /**
         * @sample '│'
         */
        'middle'?: string;
    };
    style?: {
        head?: string[];
        border?: string[];
        'padding-left'?: number;
        'padding-right'?: number;
        /**
         * @default false
         */
        compact?: boolean;
    };
    colWidths?: number[];
    /**
     * @default '...''
     */
    truncate?: string;
};
interface ICliTable extends Array<string[]> {
    toString(): string;
}
declare const CliTable: {
    new (cfg: ICliTableConfig): ICliTable;
};
export default CliTable;
export declare function makeTable(config: ICliTableConfig): ICliTable;
export declare const CHARS_CONFIG1: ICliTableConfig['chars'];
export declare const CHARS_CONFIG_SIMPLE: ICliTableConfig['chars'];
export declare function addEllipsisToOverLenCellContent(str: string, maxLen?: number): string;
export declare const WinCliType: string;
export declare function colorizeKeyword(str: string, strToMatch: string): string;
