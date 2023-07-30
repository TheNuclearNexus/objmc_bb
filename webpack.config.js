import * as path from 'path'
export default {
    mode: "development",
    devtool: "inline-source-map",
    entry: {
        main: "./src/index.ts",
    },
    output: {
        path: path.resolve('./build'),
        filename: "objmc_bb.js" // <--- Will be compiled to this single file
    },
    resolve: {
        modules: ['node_modules'],
        extensions: [".ts", ".tsx", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            }
        ]
    },
    target: 'node'
} 