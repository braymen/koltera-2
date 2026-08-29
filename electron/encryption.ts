import * as crypto from 'crypto'

const ENCRYPTION_KEY = crypto.createHash('sha256').update('Koltera 2 Playtest Save Encryption Key v1').digest()

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

export const encrypt = (text: string): string => {
    try {
        const iv = crypto.randomBytes(IV_LENGTH)
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY as crypto.CipherKey, iv as crypto.BinaryLike)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        return iv.toString('hex') + ':' + encrypted
    } catch (err) {
        console.error('Encryption error:', err)
        throw err
    }
}

export const decrypt = (encryptedText: string): string => {
    try {
        const parts = encryptedText.split(':')
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format')
        }

        const iv = Buffer.from(parts[0], 'hex')
        const encrypted = parts[1]

        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY as crypto.CipherKey, iv as crypto.BinaryLike)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (err) {
        console.error('Decryption error:', err)
        throw err
    }
}

export const isEncrypted = (text: string): boolean => {
    return text.includes(':') && !text.trim().startsWith('{') && !text.trim().startsWith('[')
}
