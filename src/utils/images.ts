// @ts-nocheck
function importAll(r: any) {
    let images = {}
    r.keys().forEach((item: string) => {
        ;(images as any)[item.replace('./', '')] = r(item)
    })
    return images
}

const images = importAll(require.context('../content/images/', true))

const get = (key: string) => {
    return (images as any)[key] ?? (images as any)['placeholder.png']
}

const Images = {
    get,
}

export default Images
