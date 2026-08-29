import { State } from '@engine/types'
import SkillingHelpers from '@modules/skilling/helpers'
import SkillContent from '@data/skills'
import MilestonesConfig from '@configs/milestones'
import { MilestoneDefinition, MilestoneTrackId } from './types'
import CreaturesContent from '@data/creatures'
import ItemsContent from '@data/items'

// ─── Progress getters ───

/** Number of creatures the player has summoned. */
export const getCreatureCount = (state: State): number => {
    return state.creatures.length
}

/** Number of unique items the player has discovered. */
export const getItemCount = (state: State): number => {
    return state.collections.items.length
}

/** Sum of all skill levels (10 skills, each 1–99). */
export const getTotalSkillLevels = (state: State): number => {
    return SkillContent.get.reduce((sum, skill) => {
        const xp = state.skills.find((s) => s.id === skill.id)?.xp || 0
        return sum + SkillingHelpers.getLevel(xp)
    }, 0)
}

/** Get the current progress value for a given track. */
export const getTrackProgress = (state: State, trackId: MilestoneTrackId): number => {
    switch (trackId) {
        case 'creatures':
            return getCreatureCount(state)
        case 'items':
            return getItemCount(state)
        case 'skills':
            return getTotalSkillLevels(state)
    }
}

/** Get the maximum possible value for a track. */
export const getTrackMax = (trackId: MilestoneTrackId): number => {
    switch (trackId) {
        case 'creatures':
            return CreaturesContent.get.length
        case 'items':
            return ItemsContent.get.length
        case 'skills':
            return 891 // 9 skills × 99
    }
}

// ─── Milestone status helpers ───

/** Check if a milestone's threshold has been reached. */
export const isMilestoneReached = (state: State, milestone: MilestoneDefinition): boolean => {
    const current = getTrackProgress(state, milestone.trackId)
    return current >= milestone.threshold
}

/** Check if a milestone has been claimed. */
export const isMilestoneClaimed = (state: State, milestoneId: string): boolean => {
    return state.milestones.includes(milestoneId)
}

/** Check if a milestone is ready to claim (reached but not yet claimed). */
export const isMilestoneClaimable = (state: State, milestone: MilestoneDefinition): boolean => {
    return isMilestoneReached(state, milestone) && !isMilestoneClaimed(state, milestone.id)
}

/** Get the number of unclaimed milestones that are ready to collect. */
export const getClaimableCount = (state: State): number => {
    return MilestonesConfig.ALL_MILESTONES.filter((m) => isMilestoneClaimable(state, m)).length
}

/** Get the number of unclaimed milestones for a specific track. */
export const getTrackClaimableCount = (state: State, trackId: MilestoneTrackId): number => {
    return MilestonesConfig.getByTrack(trackId).filter((m) => isMilestoneClaimable(state, m)).length
}

// ─── Per-track summary for UI ───

export interface TrackSummary {
    trackId: MilestoneTrackId
    name: string
    description: string
    image: string
    label: string
    isPrimary: boolean
    current: number
    max: number
    milestones: MilestoneStatus[]
    claimableCount: number
    claimedCount: number
}

export interface MilestoneStatus {
    definition: MilestoneDefinition
    reached: boolean
    claimed: boolean
    claimable: boolean
}

/** Build a full summary for a track, suitable for rendering the UI. */
export const getTrackSummary = (state: State, trackId: MilestoneTrackId): TrackSummary => {
    const trackMeta = MilestonesConfig.MILESTONE_TRACKS.find((t) => t.id === trackId)!
    const trackMilestones = MilestonesConfig.getByTrack(trackId)
    const current = getTrackProgress(state, trackId)
    const max = getTrackMax(trackId)

    const milestones: MilestoneStatus[] = trackMilestones.map((m) => ({
        definition: m,
        reached: isMilestoneReached(state, m),
        claimed: isMilestoneClaimed(state, m.id),
        claimable: isMilestoneClaimable(state, m),
    }))

    return {
        trackId,
        name: trackMeta.name,
        description: trackMeta.description,
        image: trackMeta.image,
        label: trackMeta.label,
        isPrimary: trackMeta.isPrimary,
        current,
        max,
        milestones,
        claimableCount: milestones.filter((m) => m.claimable).length,
        claimedCount: milestones.filter((m) => m.claimed).length,
    }
}

/** Build summaries for all tracks. */
export const getAllTrackSummaries = (state: State): TrackSummary[] => {
    return MilestonesConfig.MILESTONE_TRACKS.map((t) => getTrackSummary(state, t.id))
}

const MilestoneHelpers = {
    getCreatureCount,
    getItemCount,
    getTotalSkillLevels,
    getTrackProgress,
    getTrackMax,
    isMilestoneReached,
    isMilestoneClaimed,
    isMilestoneClaimable,
    getClaimableCount,
    getTrackClaimableCount,
    getTrackSummary,
    getAllTrackSummaries,
}

export default MilestoneHelpers
