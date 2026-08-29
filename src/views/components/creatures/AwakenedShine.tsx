import Images from '../../../utils/images'

interface AwakenedShineProps {
    image: string
}

const AwakenedShine = ({ image }: AwakenedShineProps) => {
    return (
        <div
            className="creature-awakened-shine"
            style={{
                WebkitMaskImage: `url(${Images.get(image)})`,
                maskImage: `url(${Images.get(image)})`,
            }}
        />
    )
}

export default AwakenedShine
