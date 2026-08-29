import { FixedUpdate, State, Update } from '@engine/types'
import { getDungeonGrade, getDungeonRewards } from './helpers'
import { collectDungeonRewards, repeatDungeon } from './functions'

export const onUpdate = (state: State, { deltaTime }: Update) => {
    if (!state.dungeons?.activeDungeons || state.dungeons.activeDungeons.length === 0) return state

    const currentTime = Date.now() / 1000
    const toAutoCollect: string[] = []

    for (const dungeon of state.dungeons.activeDungeons) {
        if (dungeon.completed) continue

        const elapsed = currentTime - dungeon.startTime

        if (elapsed >= dungeon.duration) {
            // Generate rewards
            const grade = getDungeonGrade(dungeon.partyScore, dungeon.tier)
            const rewards = getDungeonRewards(dungeon.tier, dungeon.focus, grade, dungeon.gatheringSkill)

            dungeon.completed = true
            dungeon.rewards = rewards
            dungeon.grade = grade

            // If looping, handle repeat
            if (dungeon.loop) {
                state = repeatDungeon(state, { dungeonId: dungeon.id })
                continue
            }

            // Auto-collect
            toAutoCollect.push(dungeon.id)
        }
    }

    // Auto-collect after the loop to avoid modifying array during iteration
    for (const dungeonId of toAutoCollect) {
        state = collectDungeonRewards(state, { dungeonId })
    }

    return state
}

export const onFixedUpdate = (state: State, { deltaTime }: FixedUpdate) => {
    return state
}
