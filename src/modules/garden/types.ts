export interface GardenFlower {
    flowerId: string
    x: number // Grid position (0-4)
    y: number // Grid position (0-4)
    level: number // Flower level (1-5)
}

export interface GardenState {
    flowers: GardenFlower[]
    lastCycleTime: number | null // Timestamp of last cycle completion
    rocks: Array<{ x: number; y: number }> // Positions that still have rocks
}
