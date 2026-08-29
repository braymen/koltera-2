import ItemsContent from '@data/items'
import SkillContent from '@data/skills'
import { Item } from '@modules/inventory/types'

const isItemsValid = (): boolean => {
    const items = ItemsContent.get
    const itemIds = new Set<string>()
    for (const item of items) {
        if (itemIds.has(item.id)) {
            console.error(`Duplicate item id found: '${item.id}'`)
            return false
        }
        itemIds.add(item.id)
    }
    return true
}

const isSkillsValid = (): boolean => {
    const skills = SkillContent.get
    const items = ItemsContent.get
    const itemIds = new Set(items.map((item: Item) => item.id))
    for (const skill of skills) {
        if (skill.activities) {
            for (const activity of skill.activities) {
                for (const loot of activity.output) {
                    if (!itemIds.has(loot.id)) {
                        console.error(
                            `Skill activity output item not found: Skill '${skill.id}', Activity '${activity.id}', Item '${loot.id}'`
                        )
                        return false
                    }
                }
            }
        }
    }
    return true
}

export const isDataValid = (): boolean => {
    return isItemsValid() || isSkillsValid()
}
