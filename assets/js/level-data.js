// Firelink Shrine Level Data
// Tile legend:
// ' ' = void (black, non-walkable)
// '.' = floor (walkable)
// ',' = floor with dither pattern
// '#' = wall
// '~' = water/decorative element
// 'f' = bonfire
// 'F' = Fire Keeper NPC (About)
// 'B' = Bard NPC (Music)
// 'S' = Blacksmith NPC (Miscellaneous Projects)
// 'P' = Painter NPC (Art)
// 'K' = Knight NPC (Work/Resume)
// 'L' = Librarian NPC (Writing)
// 't' = tree/vegetation
// 'k' = secret key (bronze/gold ◊)
// 'D' = secret door (initially looks like wall)
// '@' = player start position

const FIRELINK_SHRINE = {
    width: 50,
    height: 35,
    playerStart: { x: 25, y: 30 },

    // Map layout - each string is one row
    map: [
        "                                                  ",
        "                                                  ",
        "      ################    ################        ",
        "      #,,,,,,,,,,,,,,#    #,,,,,,,,,,,,,,#        ",
        "      #,,,t,,,,L,,t,,#    #,,,t,,,,P,,t,,#        ",
        "      #,,,,,,,,,,,,,,#    #,,,,,,,,,,,,,,#        ",
        "      #,,,,,,,,,,,,,,#    #,,,,,,,,,,,,,,#        ",
        "      ########,,######    ######,,########        ",
        "             #,,#              #,,#               ",
        "             #,,#              #,,#               ",
        "      ########,,##################,,########      ",
        "      #,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#      ",
        "      #,,t,,,,,,,,,,,,,,,,,,,,,,,,,,,,t,,,,#      ",
        "      #,,,,,,,,,,###########,,,,,,,,,,,,,,t#      ",
        "      #,,,,,,,,,,#,,,,,,,,,#,,,,,,,,,,,,,,,#      ",
        "      #,,,K,,,,,,#,,,fff,,,#,,,,,,,,,,,B,,,#      ",
        "      #,,,,,,,,,,#,,,fff,,,#,,,,,,,,,,,,,,t#      ",
        "      #,,,,,,,,,,#,,,fff,,,#,,,,,,,,,,,,,,,#      ",
        "      #,t,,,,,,,,#,,,,F,,,,#,,,,,,,,,,,,t,,#      ",
        "      #,,,,,,,,,,#,,,,,,,,,#,,,,,,,,,,,,,,,#      ",
        "      ########,,D###########,,,,,,,,,########      ",
        "             #,,,,,,,,,,A,,,,,,,,,,,#             ",
        "             #,,,,,,t,,,,,,,,t,,,,,,#             ",
        "      ########,,,,,,,,,,,,,,,,,,,,,,########      ",
        "      #,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#      ",
        "      #,,,t,,,,,,,,,,,,,,,,,,,,,,,,,,,t,,,,#      ",
        "      #,,,,,,,,,,,,,,S,,,,,,,,,,,,,,,,,,,,,#      ",
        "      #,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#      ",
        "      #,,,,,,,,,,,########,,,,,,,,,,,,t,,,,#      ",
        "      #,,,,,,,,,,,#,,k,,,#,,,,,,,,,,,,,,,,,#      ",
        "      #,,,,,,@,,,,#,t,,t,#,,,,,,,,,,,,,,,,,#      ",
        "      #,,,,,,,,,,t#,,,,,,#t,,,,,,,,,,,,,,,,#      ",
        "      ######################################      ",
        "                                                  ",
        "                                                  "
    ],

    // NPC data with dialogue/interaction information
    npcs: {
        'F': {
            name: 'Fire Keeper',
            char: '♀',
            color: '#ffaa00',
            category: 'about',
            title: 'About Me',
            description: 'The Fire Keeper tends the bonfire, holding secrets of the shrine.',
            items: [
                { name: 'Bio', description: 'Learn about the keeper of this space', url: 'about/index.html' },
                { name: 'Contact', description: 'Ways to reach out across the void', url: '#contact' },
                { name: 'Links', description: 'Connections to other realms', url: '#links' }
            ]
        },
        'B': {
            name: 'Bard',
            char: '♪',
            color: '#00ff41',
            category: 'music',
            title: 'Musical Creations',
            description: 'The Bard weaves ambient soundscapes from the essence of drift.',
            items: [
                { name: 'Drift v7', description: 'Latest: Generative ambient music with visual particles', url: 'projects/music/drift/Drift v7/index.html' },
                { name: 'Drift v6', description: 'Harmony through evolving layers', url: 'projects/music/drift/Drift v6/index.html' },
                { name: 'Drift v5', description: 'Meditative soundscape exploration', url: 'projects/music/drift/Drift v5/index.html' },
                { name: 'Drift v4', description: 'Advanced synthesis with Tone.js', url: 'projects/music/drift/Drift v4/index.html' },
                { name: 'Drift v3', description: 'Ethereal ambient generation', url: 'projects/music/drift/Drift v3/index.html' },
                { name: 'Drift v2', description: 'Early ambient experiments', url: 'projects/music/drift/Drift v2/index.html' },
                { name: 'Drift v1', description: 'The beginning of the drift', url: 'projects/music/drift/Drift v1/index.html' }
            ]
        },
        'S': {
            name: 'Blacksmith',
            char: '⚒',
            color: '#ff6600',
            category: 'miscellaneous',
            title: 'Forged Creations',
            description: 'The Blacksmith crafts various projects in the fires of creativity.',
            items: [
                { name: 'Benji Site', description: 'A personal project forged with care', url: 'projects/miscellaneous/benji-site/index.html' },
                { name: 'Blade Honor', description: 'Honorable blade techniques', url: 'projects/miscellaneous/blade-honor/index.html' },
                { name: 'Forward Playground', description: 'Experimental testing grounds', url: 'projects/miscellaneous/forward-playground/index.html' }
            ]
        },
        'P': {
            name: 'Painter',
            char: '✎',
            color: '#ff00ff',
            category: 'art',
            title: 'Interactive Art',
            description: 'The Painter creates interactive visions and digital canvases.',
            items: [
                { name: 'Dungeon Game', description: 'ASCII roguelike crawler', url: 'projects/art/interactive-art/dungeongame.html' },
                { name: 'Maze Send', description: 'Generative maze visualization', url: 'projects/art/interactive-art/mazesend.html' },
                { name: 'Color Explore', description: 'Interactive color journey', url: 'projects/art/interactive-art/colorexplore.html' },
                { name: 'Water Lillies', description: 'Tranquil water simulation', url: 'projects/art/interactive-art/waterlillies.html' },
                { name: 'View of a Burning City', description: 'Artistic visualization', url: 'projects/art/interactive-art/viewofaburningcity.html' },
                { name: 'Block Snow', description: 'Gentle snowfall animation', url: 'projects/art/interactive-art/blocksnow.html' },
                { name: 'Word Processor', description: 'Creative text interface', url: 'projects/art/interactive-art/wordprocessor.html' }
            ]
        },
        'K': {
            name: 'Knight',
            char: '♞',
            color: '#c0c0c0',
            category: 'work',
            title: 'Work & Honor',
            description: 'The Knight stands ready, bearing the marks of battles fought.',
            items: [
                { name: 'Resume', description: 'Chronicle of quests completed', url: 'projects/work/index.html' },
                { name: 'Portfolio', description: 'Trophies of victories won', url: 'projects/work/index.html' },
                { name: 'Experience', description: 'Wisdom gained through trials', url: 'projects/work/index.html' }
            ]
        },
        'L': {
            name: 'Librarian',
            char: '📚',
            color: '#8080ff',
            category: 'writing',
            title: 'Written Words',
            description: 'The Librarian guards ancient texts and fresh inscriptions.',
            items: [
                { name: 'Writing', description: 'Collected thoughts and tales', url: 'projects/writing/index.html' },
                { name: 'Blog', description: 'Chronicles of the journey', url: 'projects/writing/index.html' },
                { name: 'Notes', description: 'Scattered musings', url: 'projects/writing/index.html' }
            ]
        },
        'A': {
            name: 'Archivist',
            char: '⚱',
            color: '#d4af37',
            category: 'secret',
            title: 'Hidden Archives',
            description: 'The Archivist guards secrets of the past, treasures meant to be forgotten...',
            items: [
                { name: 'The Original Dungeon', description: 'Where it all began', url: 'projects/art/interactive-art/dungeongame.html' },
                { name: 'FFIX Tribute', description: 'An archived homage', url: 'archive/ffix-site/index.html' },
                { name: 'Old Shrine', description: 'The shrine before it became', url: 'archive/old-index.html' }
            ]
        }
    },

    // Tile rendering configuration
    tiles: {
        ' ': { char: ' ', walkable: false, color: '#000000' },
        '.': { char: '░', walkable: true, color: '#1a1a1a' },
        ',': { char: '▒', walkable: true, color: '#1a1a1a' },
        '#': { char: '█', walkable: false, color: '#808080' },
        '~': { char: '≈', walkable: false, color: '#0088ff' },
        'f': { char: '♨', walkable: false, color: '#ff6600', glow: true },
        't': { char: '♣', walkable: false, color: '#00ff41', glow: true },
        'k': { char: '◊', walkable: true, color: '#d4af37', glow: true, pickup: true },
        'D': { char: '█', walkable: false, color: '#909090', secret: true },
        '@': { char: ' ', walkable: true, color: '#1a1a1a' } // Player start, render as floor
    },

    // Secret room (revealed when door opens)
    secretRoom: {
        message: "You've discovered the hidden archives...",
        content: "A secret chamber filled with forgotten experiments and hidden treasures.",
        items: [
            { name: 'The Original Dungeon', description: 'Where it all began', url: 'projects/art/interactive-art/dungeongame.html' },
            { name: 'FFIX Tribute', description: 'An archived homage', url: 'archive/ffix-site/index.html' },
            { name: 'Old Shrine', description: 'The shrine before it became', url: 'archive/old-index.html' }
        ]
    }
};
