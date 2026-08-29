import path from 'path'

const config = {
    webpack: {
        alias: {
            '@engine': path.resolve(__dirname, 'src/engine'),
            '@images': path.resolve(__dirname, 'src/content/images'),
            '@sounds': path.resolve(__dirname, 'src/content/sounds'),
            '@data': path.resolve(__dirname, 'src/content/data'),
            '@modules': path.resolve(__dirname, 'src/modules'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@pages': path.resolve(__dirname, 'src/views/pages'),
            '@components': path.resolve(__dirname, 'src/views/components'),
            '@configs': path.resolve(__dirname, 'src/content/configs'),
        },
    },
    jest: {
        configure: {
            moduleNameMapper: {
                '^@engine/(.*)$': '<rootDir>/src/engine/$1',
                '^@images/(.*)$': '<rootDir>/src/content/images/$1',
                '^@sounds/(.*)$': '<rootDir>/src/content/sounds/$1',
                '^@data/(.*)$': '<rootDir>/src/content/data/$1',
                '^@modules/(.*)$': '<rootDir>/src/modules/$1',
                '^@utils/(.*)$': '<rootDir>/src/utils/$1',
                '^@pages/(.*)$': '<rootDir>/src/views/pages/$1',
                '^@components/(.*)$': '<rootDir>/src/views/components/$1',
                '^@configs/(.*)$': '<rootDir>/src/content/configs/$1',
            },
        },
    },
}

export default config
