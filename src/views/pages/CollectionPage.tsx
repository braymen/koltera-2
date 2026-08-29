import CollectionBrowserPanel from '@components/panels/CollectionBrowserPanel'
import { StateProps } from '@engine/types'
import { CollectionTypes } from '@modules/collections/types'

export function makeCollectionPage(collectionType: CollectionTypes) {
    return function CollectionPage({ state, dispatch }: StateProps) {
        return (
            <div style={{ maxWidth: '887px', margin: 'auto' }}>
                <CollectionBrowserPanel state={state} dispatch={dispatch} collectionType={collectionType} />
            </div>
        )
    }
}
