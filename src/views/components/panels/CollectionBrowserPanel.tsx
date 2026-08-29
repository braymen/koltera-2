import Panel from '@components/common/Panel'
import { StateProps } from '@engine/types'
import Tooltip from '@components/common/Tooltip'
import { getFullCollection } from '@modules/collections/helpers'
import { CollectionTypes } from '@modules/collections/types'
import Images from '@utils/images'
import CreaturesContent from '@data/creatures'
import AwakenedShine from '@components/creatures/AwakenedShine'

export interface Props extends StateProps {
    collectionType: CollectionTypes
}

function CollectionBrowserPanel({ state, dispatch, collectionType }: Props) {
    // Get Collection Information
    const collected = state.collections[collectionType]
    const fullCollection = getFullCollection(collectionType).filter((entry) => entry.id !== 'nothing')

    return (
        <Panel>
            <div style={{ display: 'flex', gap: '2px', width: '100%', flexWrap: 'wrap', marginTop: '0px' }}>
                {fullCollection.map((entry) => {
                    const isCollected = collected.includes(entry.id)
                    // Check if this creature has been awakened (only for creatures collection)
                    const isAwakened =
                        collectionType === 'creatures' &&
                        isCollected &&
                        state.creatures.some((creature) => creature.species === entry.id && creature.awakened)
                    return (
                        <div key={entry.id} style={{ width: '45.92px', height: '45.92px', flexShrink: 0, position: 'relative' }}>
                            <Tooltip
                                disabled={!isCollected && collectionType !== 'achievements'}
                                content={
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <img
                                            className="pixel"
                                            src={Images.get(entry.image)}
                                            alt={entry.name}
                                            style={{
                                                width: '38px',
                                                height: '38px',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h1
                                                style={{
                                                    fontSize: '18px',
                                                    color: 'white',
                                                    margin: 0,
                                                    padding: 0,
                                                    marginTop: '-10px',
                                                }}
                                            >
                                                {entry.name}
                                            </h1>
                                            <p
                                                style={{
                                                    fontSize: '18px',
                                                    color: 'rgba(255,255,255,0.8)',
                                                    marginTop: '-6px',
                                                    padding: 0,
                                                    lineHeight: '0.9',
                                                }}
                                            >
                                                {entry.description}
                                            </p>
                                        </div>
                                    </div>
                                }
                            >
                                <div
                                    className={isCollected ? 'collection-item' : ''}
                                    style={{
                                        width: '45.92px',
                                        height: '45.92px',
                                        backgroundColor: 'rgba(255,255,255,' + (isCollected ? 0.1 : 0.01) + ')',
                                        border: isCollected
                                            ? '1px solid rgba(255,255,255,0.2)'
                                            : '1px solid rgba(255,255,255,0.05)',
                                        position: 'relative',
                                    }}
                                >
                                    <center>
                                        <div
                                            className={isAwakened ? 'creature-awakened' : ''}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                marginTop: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isAwakened && <AwakenedShine image={entry.image} />}
                                            <img
                                                className="pixel"
                                                src={Images.get(entry.image)}
                                                alt={entry.name}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    opacity: isCollected ? 1 : 0.02,
                                                }}
                                            />
                                        </div>
                                    </center>
                                    {isAwakened && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: '2px',
                                                right: '2px',
                                                color: '#ff1493',
                                                fontSize: '12px',
                                                lineHeight: '1',
                                            }}
                                        >
                                            ★
                                        </span>
                                    )}
                                </div>
                            </Tooltip>
                        </div>
                    )
                })}
            </div>
        </Panel>
    )
}

export default CollectionBrowserPanel
