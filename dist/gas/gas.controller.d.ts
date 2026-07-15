import { GasService } from './gas.service';
export declare class GasController {
    private readonly gasService;
    constructor(gasService: GasService);
    execute(body: {
        functionName: string;
        args: any[];
    }): Promise<{
        result: any;
        error?: undefined;
    } | {
        error: any;
        result?: undefined;
    }>;
}
