// Task difficulty tiers — each entry produces `count` tasks with the given amount and gold reward.
// Adjust `amount` (items required) and `goldReward` to tune difficulty and payout.
const TASKBOARD_TASK_TIERS = [
    { amount: 50, goldReward: 2000, count: 2 }, // Easy
    { amount: 100, goldReward: 4000, count: 2 }, // Medium
    { amount: 200, goldReward: 8000, count: 2 }, // Hard
    { amount: 400, goldReward: 16000, count: 2 }, // Very Hard
]

const TASKBOARD_COOLDOWNS = {
    // How long (in seconds) a completed individual task is locked before it can be refreshed
    INDIVIDUAL_TASK_COOLDOWN_SECONDS: 20 * 60 * 60, // 20 hours
}

const TaskboardConfig = {
    TASK_TIERS: TASKBOARD_TASK_TIERS,
    COOLDOWNS: TASKBOARD_COOLDOWNS,
}

export default TaskboardConfig
