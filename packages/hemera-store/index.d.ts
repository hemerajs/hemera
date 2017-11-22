export = HemeraStore;
declare class Store {
        readonly driver: any;
        readonly options: any;

        constructor(driver:any, options?:any);

        create(...args: any[]);

        exists(...args: any[]);

        find(...args: any[]);

        findById(...args: any[]);

        remove(...args: any[]);

        removeById(...args: any[]);

        replace(...args: any[]);

        replaceById(...args: any[]);

        update(...args: any[]);

        updateById(...args: any[]);
}
