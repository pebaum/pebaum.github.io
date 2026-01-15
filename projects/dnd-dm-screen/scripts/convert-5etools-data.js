/**
 * 5etools Data Converter
 * Converts local 5etools data to simplified DM Screen format
 *
 * USAGE:
 * 1. Download 5etools from get.5e.tools
 * 2. Extract to a directory (e.g., C:\5etools-img\)
 * 3. Run: node convert-5etools-data.js "C:\5etools-img\data"
 */

const fs = require('fs');
const path = require('path');

// 5etools data sources - organized by category
const DATA_SOURCES = {
    monsters: [
        'bestiary-mm.json',
        'bestiary-vgm.json',
        'bestiary-mtf.json',
        'bestiary-mpmm.json',
        'bestiary-cos.json',
        'bestiary-toa.json',
        'bestiary-skt.json',
        'bestiary-tftyp.json',
        'bestiary-wdh.json',
        'bestiary-wdmm.json',
        'bestiary-gos.json',
        'bestiary-ai.json',
        'bestiary-erlw.json',
        'bestiary-rime.json',
        'bestiary-tcsr.json',
        'bestiary-bgdia.json',
        'bestiary-vrgr.json',
        'bestiary-ftd.json'
    ],
    spells: [
        'spells-phb.json',
        'spells-xge.json',
        'spells-tce.json',
        'spells-ai.json',
        'spells-ggr.json',
        'spells-ftd.json',
        'spells-scc.json',
        'spells-idrotf.json'
    ]
};

/**
 * Load JSON data from local file
 */
function loadJSON(filePath) {
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(filePath)) {
                console.log(`    File not found: ${path.basename(filePath)} (skipping)`);
                resolve({ monster: [], spell: [] });
                return;
            }

            const data = fs.readFileSync(filePath, 'utf8');
            resolve(JSON.parse(data));
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Strip 5etools markup tags
 */
function stripMarkup(text) {
    if (!text) return text;
    if (typeof text !== 'string') return text;

    // Remove {@tag content} and keep content
    return text.replace(/\{@\w+\s+([^}]+)\}/g, '$1')
               .replace(/\{@\w+\}/g, '');
}

/**
 * Convert size code to full name
 */
function convertSize(size) {
    const sizeMap = {
        'T': 'Tiny',
        'S': 'Small',
        'M': 'Medium',
        'L': 'Large',
        'H': 'Huge',
        'G': 'Gargantuan'
    };

    if (Array.isArray(size)) {
        return sizeMap[size[0]] || size[0];
    }
    return sizeMap[size] || size;
}

/**
 * Convert alignment array to string
 */
function convertAlignment(alignment) {
    if (!alignment) return 'unaligned';
    if (typeof alignment === 'string') return alignment;
    if (Array.isArray(alignment)) {
        const alignMap = {
            'L': 'lawful', 'N': 'neutral', 'C': 'chaotic',
            'G': 'good', 'E': 'evil', 'U': 'unaligned',
            'A': 'any alignment'
        };
        return alignment.map(a => alignMap[a] || a).join(' ');
    }
    return 'unaligned';
}

/**
 * Convert 5etools monster to simple format
 */
function convertMonster(monster) {
    // Handle AC
    let ac = 10;
    let acDetails = '';
    if (Array.isArray(monster.ac)) {
        ac = monster.ac[0]?.ac || monster.ac[0] || 10;
        if (monster.ac[0]?.from) {
            acDetails = monster.ac[0].from.join(', ');
        }
    } else {
        ac = monster.ac || 10;
    }

    // Handle HP
    const hp = monster.hp?.average || monster.hp || 1;
    const hd = monster.hp?.formula || '';

    // Handle type
    let type = 'unknown';
    if (typeof monster.type === 'object') {
        type = monster.type.type || 'unknown';
        if (monster.type.tags && monster.type.tags.length > 0) {
            type += ` (${monster.type.tags.join(', ')})`;
        }
    } else {
        type = monster.type || 'unknown';
    }

    // Handle speed
    let speed = '30 ft.';
    if (monster.speed) {
        if (typeof monster.speed === 'object') {
            const speeds = [];
            if (monster.speed.walk) speeds.push(`walk ${monster.speed.walk} ft.`);
            if (monster.speed.fly) speeds.push(`fly ${monster.speed.fly} ft.`);
            if (monster.speed.swim) speeds.push(`swim ${monster.speed.swim} ft.`);
            if (monster.speed.burrow) speeds.push(`burrow ${monster.speed.burrow} ft.`);
            speed = speeds.join(', ') || '30 ft.';
        } else {
            speed = monster.speed;
        }
    }

    // Handle skills
    let skills = null;
    if (monster.skill) {
        skills = Object.entries(monster.skill).map(([skill, bonus]) =>
            `${skill.charAt(0).toUpperCase() + skill.slice(1)} ${bonus}`
        ).join(', ');
    }

    // Handle senses
    let senses = '';
    if (monster.senses) {
        senses = Array.isArray(monster.senses) ? monster.senses.join(', ') : monster.senses;
    }
    if (monster.passive) {
        senses += (senses ? ', ' : '') + `passive Perception ${monster.passive}`;
    }

    // Handle languages
    let languages = '';
    if (monster.languages) {
        languages = Array.isArray(monster.languages) ? monster.languages.join(', ') : monster.languages;
    }

    // Convert traits (strip markup)
    const traits = (monster.trait || []).map(trait => ({
        name: stripMarkup(trait.name),
        entries: trait.entries.map(e => stripMarkup(typeof e === 'string' ? e : JSON.stringify(e)))
    }));

    // Convert actions (strip markup)
    const actions = (monster.action || []).map(action => ({
        name: stripMarkup(action.name),
        entries: action.entries.map(e => stripMarkup(typeof e === 'string' ? e : JSON.stringify(e)))
    }));

    // Build simplified monster
    const simple = {
        name: monster.name,
        source: monster.source || 'Unknown',
        size: convertSize(monster.size),
        type: type,
        alignment: convertAlignment(monster.alignment),
        ac: ac,
        hp: hp,
        speed: speed,
        str: monster.str || 10,
        dex: monster.dex || 10,
        con: monster.con || 10,
        int: monster.int || 10,
        wis: monster.wis || 10,
        cha: monster.cha || 10,
        cr: typeof monster.cr === 'object' ? monster.cr.cr : monster.cr,
        traits: traits,
        actions: actions
    };

    // Add optional fields
    if (acDetails) simple.acDetails = acDetails;
    if (hd) simple.hd = hd;
    if (skills) simple.skills = skills;
    if (senses) simple.senses = senses;
    if (languages) simple.languages = languages;
    if (monster.save) {
        simple.savingThrows = Object.entries(monster.save).map(([save, bonus]) =>
            `${save.toUpperCase()} ${bonus}`
        ).join(', ');
    }
    if (monster.legendary) {
        simple.legendary = monster.legendary.map(leg => ({
            name: stripMarkup(leg.name),
            entries: leg.entries.map(e => stripMarkup(typeof e === 'string' ? e : JSON.stringify(e)))
        }));
    }

    return simple;
}

/**
 * Convert 5etools spell to simple format
 */
function convertSpell(spell) {
    // School abbreviation to full name
    const schoolMap = {
        'A': 'Abjuration', 'C': 'Conjuration', 'D': 'Divination',
        'E': 'Enchantment', 'V': 'Evocation', 'I': 'Illusion',
        'N': 'Necromancy', 'T': 'Transmutation'
    };

    const school = schoolMap[spell.school] || spell.school || 'Unknown';

    // Handle casting time
    let castingTime = '1 action';
    if (spell.time && spell.time[0]) {
        const t = spell.time[0];
        castingTime = `${t.number} ${t.unit}`;
    }

    // Handle range
    let range = 'Self';
    if (spell.range) {
        if (spell.range.type === 'point') {
            range = spell.range.distance.amount ?
                `${spell.range.distance.amount} ${spell.range.distance.type}` :
                'Self';
        } else {
            range = spell.range.type;
        }
    }

    // Handle components
    let components = '';
    if (spell.components) {
        const comps = [];
        if (spell.components.v) comps.push('V');
        if (spell.components.s) comps.push('S');
        if (spell.components.m) {
            if (typeof spell.components.m === 'string') {
                comps.push(`M (${spell.components.m})`);
            } else if (spell.components.m.text) {
                comps.push(`M (${spell.components.m.text})`);
            } else {
                comps.push('M');
            }
        }
        components = comps.join(', ');
    }

    // Handle duration
    let duration = 'Instantaneous';
    if (spell.duration && spell.duration[0]) {
        const d = spell.duration[0];
        if (d.type === 'instant') {
            duration = 'Instantaneous';
        } else if (d.type === 'permanent') {
            duration = 'Permanent';
        } else if (d.duration) {
            duration = `${d.duration.amount || ''} ${d.duration.type || ''}`.trim();
            if (d.concentration) duration = `Concentration, up to ${duration}`;
        }
    }

    // Handle classes
    let classes = [];
    if (spell.classes && spell.classes.fromClassList) {
        classes = spell.classes.fromClassList.map(c => c.name);
    }

    // Strip markup from entries
    const entries = (spell.entries || []).map(e =>
        stripMarkup(typeof e === 'string' ? e : e.entries ? e.entries.join(' ') : '')
    ).filter(e => e);

    // Higher level text
    let entriesHigherLevel = [];
    if (spell.entriesHigherLevel) {
        entriesHigherLevel = spell.entriesHigherLevel.map(h =>
            stripMarkup(h.entries ? h.entries.join(' ') : '')
        ).filter(e => e);
    }

    return {
        name: spell.name,
        source: spell.source || 'PHB',
        level: spell.level,
        school: school,
        castingTime: castingTime,
        range: range,
        components: components,
        duration: duration,
        classes: classes,
        entries: entries,
        entriesHigherLevel: entriesHigherLevel
    };
}

/**
 * Convert all data from local 5etools directory
 */
async function convertAll(dataDir) {
    console.log('Starting 5etools data conversion...\n');
    console.log(`Reading from: ${dataDir}\n`);

    // Validate input directory
    if (!fs.existsSync(dataDir)) {
        console.error(`Error: Directory not found: ${dataDir}`);
        console.error('\nUsage: node convert-5etools-data.js "C:\\path\\to\\5etools\\data"');
        process.exit(1);
    }

    const outputDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert monsters
    console.log('Processing monsters...');
    const allMonsters = [];

    for (const file of DATA_SOURCES.monsters) {
        const filePath = path.join(dataDir, 'bestiary', file);
        console.log(`  Loading ${file}...`);

        try {
            const data = await loadJSON(filePath);
            const monsters = data.monster || [];
            console.log(`    Found ${monsters.length} monsters`);

            for (const monster of monsters) {
                allMonsters.push(convertMonster(monster));
            }
        } catch (err) {
            console.log(`    Error: ${err.message} (skipping)`);
        }
    }

    console.log(`\nTotal monsters: ${allMonsters.length}`);

    // Save monsters
    const monstersOutput = {
        monsters: allMonsters
    };
    fs.writeFileSync(
        path.join(outputDir, 'monsters.json'),
        JSON.stringify(monstersOutput, null, 2)
    );
    console.log('✓ Saved monsters.json\n');

    // Convert spells
    console.log('Processing spells...');
    const allSpells = [];

    for (const file of DATA_SOURCES.spells) {
        const filePath = path.join(dataDir, 'spells', file);
        console.log(`  Loading ${file}...`);

        try {
            const data = await loadJSON(filePath);
            const spells = data.spell || [];
            console.log(`    Found ${spells.length} spells`);

            for (const spell of spells) {
                allSpells.push(convertSpell(spell));
            }
        } catch (err) {
            console.log(`    Error: ${err.message} (skipping)`);
        }
    }

    console.log(`\nTotal spells: ${allSpells.length}`);

    // Save spells
    const spellsOutput = {
        spells: allSpells
    };
    fs.writeFileSync(
        path.join(outputDir, 'spells.json'),
        JSON.stringify(spellsOutput, null, 2)
    );
    console.log('✓ Saved spells.json\n');

    console.log('Conversion complete!');
    console.log(`  Monsters: ${allMonsters.length}`);
    console.log(`  Spells: ${allSpells.length}`);
}

// Get data directory from command line or use default
const dataDir = process.argv[2] || 'C:\\5etools-img\\data';

// Run conversion
convertAll(dataDir).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
