import { StoryTask } from '@modules/story/types'
import ItemsContent from './items'

const tasks: StoryTask[] = [
    {
        id: 'Getting Started',
        title: 'Getting Started',
        description:
            "Welcome to Koltera, my friend! I have been waiting on your arrival and I must say, I am quite excited to help you get started. Here's an axe. Go to the chopping tab in your navigation and start by collecting me some twigs!",
        requirements: [{ type: 'item', id: 'twig', amount: 5 }],
        reward: {
            items: [{ id: 'pouch', amount: 5 }],
            unlockTabs: ['Chopping'],
        },
    },
    {
        id: 'Openning up Containers',
        title: 'Openning up Containers',
        description:
            'I see you have collected me some amazing twigs. Just perfect. Now, you may have noticed, but I have slipped a few pouches... maybe a little too many... into your backpack. Do open those. In the inventory tab, go to the container filter and than open those pouches! Quickly now. Bring me one of those charms.',
        requirements: [{ type: 'item', id: 'chopping-charm', amount: 1 }],
        reward: {
            items: [
                { id: 'pouch', amount: 5 },
                { id: 'chopping-charm', amount: 1 },
                { id: 'leaf', amount: 5 },
            ],
            unlockTabs: ['Summoning'],
        },
    },
    {
        id: 'Summoning Friendly Creatures',
        title: 'Mining',
        description:
            "I'm sorry for all the pouches... but you will be thankful for them! I have too many anyways. Now, you see this charm. It's one of the critical resources for summoning creatures. Make sure you collect some leaves first, but once you do, go to the summon tab. Your goal in Koltera is to summon every creature!",
        requirements: [{ type: 'creatureSummoned', species: 'moss' }],
        reward: {
            items: [
                { id: 'fire-flower', amount: 1 },
                { id: 'gold', amount: 750 },
            ],
            unlockTabs: ['Garden'],
        },
    },
    {
        id: 'Planting a Flower',
        title: 'Workbench Crafting',
        description:
            "Now that you have a friend, you are probably going to want more around here. Go to the garden tab and plant that bad boy. It'll start spitting out fire essence which is another critical resource for stronger creatures. The garden gives resources every 60 seconds. You will want every type of flower as essence is critical for every summon.",
        requirements: [{ type: 'item', id: 'raw-fire-essence', amount: 1 }],
        reward: {
            items: [
                { id: 'fertilizer', amount: 6 },
                { id: 'stone', amount: 16 },
            ],
            unlockTabs: ['Workbench', 'Mining'],
        },
    },
    {
        id: 'Using the Workbench',
        title: 'Using the Workbench',
        description:
            'Nothing will come easy around here. You will need to learn your way around the workstations, starting with the workbench. Craft me a hammer with the stone I gave and the twigs you have. If you somehow mess that up, I gave you a map to the mining area so you can collect more stone yourself...',
        requirements: [{ type: 'item', id: 'hammer', amount: 1 }],
        reward: {
            items: [
                { id: 'hammer', amount: 1 },
                { id: 'copper-ore', amount: 32 },
                { id: 'twig', amount: 64 },
            ],
            unlockTabs: ['Furnace'],
        },
    },
    {
        id: 'Using the Furnace',
        title: 'Using the Furnace',
        description:
            "A money maker around here will be from your use of the furnace. There's a lot of people needing bars around here. And no, not those kind of bars. First make some coal, than make me a copper bar with that ore I gave you.",
        requirements: [{ type: 'item', id: 'copper-bar', amount: 1 }],
        reward: {
            items: [
                { id: 'coal', amount: 64 },
                { id: 'copper-bar', amount: 1 },
            ],
            unlockTabs: ['Stove'],
        },
    },
    {
        id: 'Making the Gold',
        title: 'Making the Gold',
        description:
            "There's a lot of gold to be made from your hardwork. How about you go and sell those copper bars? In your inventory, there's a sellable filter. Let's see if you can make me... I mean yourself some gold!",
        requirements: [{ type: 'item', id: 'gold', amount: ItemsContent.getById('copper-bar').sellValue ?? 10 }],
        reward: {
            items: [{ id: 'gold', amount: 500 }],
            unlockTabs: ['Task Board', 'Merchant'],
        },
    },
    {
        id: 'Milk Time',
        title: 'Milk Time',
        description:
            "Good, you know how to make some money now. There's also a task board with some daily tasks to help too. I'm getting thirsty though and I need my milk. Go to the merchant and buy me some milk! I deserve it after teaching you all that I know! ",
        requirements: [{ type: 'item', id: 'milk', amount: 1 }],
        reward: {
            items: [{ id: 'gold', amount: 1000 }],
            unlockTabs: [],
        },
    },
    {
        id: 'A Friendly Hand',
        title: 'A Friendly Hand',
        description:
            'Thank you for my milk. Now, you may have already figured it out, but how about you show your new creature how it can help you out. Go to the helper tab and assign it to a skill. Come back when you do.',
        requirements: [{ type: 'creatureHelper', species: 'moss' }],
        reward: {
            items: [{ id: 'backpack', amount: 1 }],
            unlockTabs: ['Expeditions'],
        },
    },
    {
        id: 'Expedition Assignment',
        title: 'Expedition Assignment',
        description:
            "Now, go unassign that creature and let's show them how to do an expedition. These resources are much harder to get. Just assign an expedition and come back. This is our final lesson. You will be free to do as you please and I'll give you a map of the remaining places available to you.",
        requirements: [{ type: 'assignedExpedition' }],
        reward: {
            items: [
                { id: 'charm-crate', amount: 5 },
                { id: 'braymens-letter', amount: 1 },
            ],
            unlockTabs: [
                'Exploring',
                'Digging',
                'Fishing',
                'Farming',
                'Awaken Tree',
                'Tools',
                'Milestones',
                'Machines',
                'Dirt to Riches',
                'Dungeons',
            ],
        },
    },
] satisfies StoryTask[]

const get = tasks

const Lookup: Record<string, StoryTask> = {}
tasks.forEach((task) => {
    Lookup[task.id] = task
})

const getById = (id: string) => Lookup[id]

const StoryContent = {
    get,
    getById,
}

export default StoryContent
