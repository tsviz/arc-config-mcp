// Type declarations for modules that might not have complete types

declare module 'fs-extra' {
    export * from 'fs-extra';
}

declare module 'express' {
    export * from 'express';
}

declare module 'cors' {
    export * from 'cors';
}

// Additional type augmentations
declare global {
    namespace Express {
        interface Request {
            user?: any;
            context?: any;
        }
    }
}

export { };