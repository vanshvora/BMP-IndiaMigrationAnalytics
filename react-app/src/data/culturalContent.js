import { CULTURAL_CATEGORIES, getCulturalStateDisplayName } from '../utils/culturalAssets';

const CATEGORY_TITLES = {
    dance: 'Movement Traditions',
    dress: 'Textile Identity',
    festival: 'Shared Celebrations',
    food: 'Culinary Traditions',
    heritage: 'Living Memory',
};

const PROFILE_LIBRARY = {
    himalayan: {
        intro: '{state} reflects mountain-region traditions where ritual spaces, seasonal travel, and craft lineages remain closely connected.',
        dance: {
            description: 'Performance traditions in {state} are shaped by devotional gatherings, local instruments, and seasonal community events.',
            highlight: 'Many public performances are tied to annual fairs and local temple calendars.',
        },
        dress: {
            description: 'Layered attire, wool-based textiles, and handwork techniques respond to climate, terrain, and ceremonial occasions.',
            highlight: 'Woven shawls and region-specific headgear remain important visual markers.',
        },
        festival: {
            description: 'Festivals in {state} often blend pilgrimage routes, harvest observances, and neighborhood participation across generations.',
            highlight: 'Public processions and community-led rituals anchor the festive cycle.',
        },
        food: {
            description: 'Cuisine in {state} balances grain staples, preserved ingredients, and slow-cooked preparations suited to highland living.',
            highlight: 'Everyday meals commonly emphasize warmth, simplicity, and seasonal produce.',
        },
        heritage: {
            description: 'Monastic sites, temple networks, and historic settlements in {state} preserve layered architectural and cultural histories.',
            highlight: 'Living heritage is sustained through ongoing ritual use and local stewardship.',
        },
    },
    gangetic_plains: {
        intro: '{state} carries a strong plains cultural continuum where riverine histories, crafts, and ceremonial life remain deeply interconnected.',
        dance: {
            description: 'Dance vocabularies in {state} span classical influence and community storytelling in both rural and urban settings.',
            highlight: 'Performance spaces often include courtyards, ghats, and festive public stages.',
        },
        dress: {
            description: 'Dress traditions in {state} foreground weaving, embroidery, and drape practices linked to everyday and ceremonial contexts.',
            highlight: 'Formal occasions often feature finely worked regional textiles.',
        },
        festival: {
            description: 'Festival culture in {state} is calendar-rich, with major observances bringing collective participation and ritual continuity.',
            highlight: 'Household rituals and large public events typically coexist in the festive rhythm.',
        },
        food: {
            description: 'Food practices in {state} combine grain-led staples, festive sweets, and regionally adapted spice profiles.',
            highlight: 'Seasonal menus and ceremonial cooking remain important to social gatherings.',
        },
        heritage: {
            description: '{state} preserves dense heritage layers across sacred towns, historic cores, and long-standing craft centers.',
            highlight: 'Built heritage and living cultural practice continue to reinforce each other.',
        },
    },
    arid_west: {
        intro: '{state} presents a strong desert-and-semi-arid cultural character where performance, craft, and architecture respond to climate and trade routes.',
        dance: {
            description: 'Dance in {state} is often rhythmic, expressive, and community-oriented, with strong links to oral narrative and music.',
            highlight: 'Group performance remains central to fairground and festive settings.',
        },
        dress: {
            description: 'Attire traditions in {state} use vivid surface work, structured silhouettes, and practical layering for arid conditions.',
            highlight: 'Mirror work, embroidery, and region-specific drapes remain widely recognized.',
        },
        festival: {
            description: 'Festivals in {state} emphasize public spectacle, devotional observance, and marketplace energy.',
            highlight: 'Local fairs frequently combine ritual, craft exchange, and performance.',
        },
        food: {
            description: 'Cuisine in {state} favors robust flavoring, preserved elements, and recipes adapted to limited-water environments.',
            highlight: 'Many dishes are designed for durability, portability, and shared service.',
        },
        heritage: {
            description: 'Fortified settlements, palace precincts, and stepwell traditions define the heritage profile of {state}.',
            highlight: 'Material heritage reflects both ecological adaptation and courtly design history.',
        },
    },
    western_coastal: {
        intro: '{state} blends maritime contact, inland craft traditions, and urban-rural continuity into a layered coastal cultural profile.',
        dance: {
            description: 'Dance forms in {state} combine ritual theater, folk movement, and contemporary stage practice.',
            highlight: 'Coastal and inland performance traditions frequently coexist within festival circuits.',
        },
        dress: {
            description: 'Dress in {state} reflects cotton-rich fabrics, handloom culture, and region-specific ceremonial styling.',
            highlight: 'Textile expression spans both everyday practicality and ornate occasion wear.',
        },
        festival: {
            description: 'Festivals in {state} integrate temple traditions, neighborhood participation, and large civic celebrations.',
            highlight: 'Public music, procession routes, and local community associations shape the festive atmosphere.',
        },
        food: {
            description: 'Culinary culture in {state} balances coastal produce, inland grain traditions, and strong regional flavor identities.',
            highlight: 'Seasonal ingredients and household recipe lineage remain culturally significant.',
        },
        heritage: {
            description: 'Heritage in {state} spans port legacies, sacred precincts, and layered architectural influences.',
            highlight: 'Historic neighborhoods often retain active cultural use alongside formal conservation.',
        },
    },
    eastern_plateau: {
        intro: '{state} reflects plateau and forest-edge traditions where craft, ritual, and food practices are tied to land, labor, and community memory.',
        dance: {
            description: 'Dance in {state} is closely linked to collective celebration, local drumming traditions, and seasonal events.',
            highlight: 'Community-led performances remain central to cultural continuity.',
        },
        dress: {
            description: 'Dress practices in {state} include handloom textures, practical drapes, and ornament traditions shaped by local context.',
            highlight: 'Ceremonial attire often highlights region-specific weaving and surface detailing.',
        },
        festival: {
            description: 'Festival life in {state} combines agrarian cycles, devotional observance, and neighborhood participation.',
            highlight: 'Local calendars often align celebration with harvest and community rites.',
        },
        food: {
            description: 'Food culture in {state} emphasizes grain diversity, local greens, and preparations tuned to seasonal availability.',
            highlight: 'Traditional meals commonly balance everyday simplicity with festive depth.',
        },
        heritage: {
            description: 'Heritage in {state} is expressed through temple sites, craft districts, and historically rooted settlement patterns.',
            highlight: 'Living traditions continue to animate heritage spaces beyond monument value.',
        },
    },
    northeastern_hills: {
        intro: '{state} represents a hill-and-valley cultural landscape with strong community institutions, craft identity, and festival-based social life.',
        dance: {
            description: 'Dance in {state} is often ensemble-led, rhythm-focused, and connected to local ceremonial traditions.',
            highlight: 'Collective participation and costume are key parts of performance identity.',
        },
        dress: {
            description: 'Dress traditions in {state} highlight woven structure, patterned textiles, and clan or community-linked styling.',
            highlight: 'Handwoven fabrics remain central to both everyday and ceremonial expression.',
        },
        festival: {
            description: 'Festival culture in {state} foregrounds seasonal milestones, community gatherings, and shared performance.',
            highlight: 'Cultural festivals frequently serve as inter-community platforms.',
        },
        food: {
            description: 'Cuisine in {state} reflects local produce, fermentation practices, and region-specific methods of preservation.',
            highlight: 'Ingredient freshness and minimal processing shape many traditional preparations.',
        },
        heritage: {
            description: 'Heritage in {state} includes sacred landscapes, community architecture, and long-standing material traditions.',
            highlight: 'Oral history and living practice are as important as built heritage.',
        },
    },
    southern_peninsular: {
        intro: '{state} carries a strong peninsular cultural fabric where classical forms, regional cuisines, and temple-linked traditions remain influential.',
        dance: {
            description: 'Dance traditions in {state} include codified forms alongside local performance lineages sustained through training and festivals.',
            highlight: 'Stage and ritual settings both contribute to the dance ecosystem.',
        },
        dress: {
            description: 'Dress culture in {state} is shaped by drape traditions, silk and cotton weaving, and occasion-specific ornamentation.',
            highlight: 'Regional handloom networks continue to inform contemporary attire.',
        },
        festival: {
            description: 'Festivals in {state} combine temple observance, household ritual, and large community gatherings.',
            highlight: 'Seasonal processions and shared food traditions anchor public celebration.',
        },
        food: {
            description: 'Cuisine in {state} balances grain diversity, spice layering, and distinct regional preparation methods.',
            highlight: 'Meal structure often emphasizes both everyday balance and festive specialization.',
        },
        heritage: {
            description: 'Heritage in {state} includes temple complexes, historic settlements, and enduring craft-production corridors.',
            highlight: 'Architecture and ritual practice continue to operate as an integrated cultural system.',
        },
    },
    metropolitan_union: {
        intro: '{state} reflects a compact yet layered cultural identity where institutional spaces, migrant traditions, and local heritage converge.',
        dance: {
            description: 'Dance culture in {state} blends classical repertoires, community forms, and contemporary stage expression.',
            highlight: 'Festive events frequently present multiple traditions in shared civic spaces.',
        },
        dress: {
            description: 'Dress practices in {state} reflect both long-standing local styles and cross-regional influences.',
            highlight: 'Ceremonial attire often highlights handcrafted textiles and formal drape patterns.',
        },
        festival: {
            description: 'Festival life in {state} is multi-community, with public venues hosting diverse cultural observances.',
            highlight: 'Shared urban celebrations often combine ritual and civic programming.',
        },
        food: {
            description: 'Cuisine in {state} is shaped by migration, local staples, and a broad spectrum of regional influences.',
            highlight: 'Street food and household traditions both contribute to culinary identity.',
        },
        heritage: {
            description: 'Heritage in {state} spans institutional architecture, historic neighborhoods, and active cultural venues.',
            highlight: 'Adaptive reuse and continued public access support heritage continuity.',
        },
    },
    islands: {
        intro: '{state} presents an island cultural context where coastal ecology, mobility, and layered settlement histories inform everyday traditions.',
        dance: {
            description: 'Dance practices in {state} often emphasize community participation, rhythm-led movement, and ceremonial continuity.',
            highlight: 'Festival gatherings remain key spaces for performance exchange.',
        },
        dress: {
            description: 'Dress in {state} reflects climate-responsive fabrics and layered influences from surrounding cultural networks.',
            highlight: 'Lightweight textiles and occasion-based styling are widely observed.',
        },
        festival: {
            description: 'Festival culture in {state} combines devotional events, seasonal markers, and collective neighborhood participation.',
            highlight: 'Public celebrations often connect land, sea, and community memory.',
        },
        food: {
            description: 'Food traditions in {state} center on coastal produce, fresh preparations, and regionally adapted spice balances.',
            highlight: 'Cuisine frequently reflects both maritime resources and migrant exchange.',
        },
        heritage: {
            description: 'Heritage in {state} includes coastal settlements, memorial sites, and enduring local cultural practices.',
            highlight: 'Cultural continuity relies on active community use of heritage spaces.',
        },
    },
};

const STATE_PROFILE_MAP = {
    'ANDAMAN & NICOBAR ISLANDS': 'islands',
    'ANDHRA PRADESH': 'southern_peninsular',
    'ARUNACHAL PRADESH': 'northeastern_hills',
    ASSAM: 'northeastern_hills',
    BIHAR: 'gangetic_plains',
    CHANDIGARH: 'metropolitan_union',
    CHHATTISGARH: 'eastern_plateau',
    'DADRA & NAGAR HAVELI': 'metropolitan_union',
    'DAMAN & DIU': 'metropolitan_union',
    'DADRA & NAGAR HAVELI AND DAMAN & DIU': 'metropolitan_union',
    'NCT OF DELHI': 'metropolitan_union',
    GOA: 'western_coastal',
    GUJARAT: 'western_coastal',
    HARYANA: 'gangetic_plains',
    'HIMACHAL PRADESH': 'himalayan',
    'JAMMU & KASHMIR': 'himalayan',
    JHARKHAND: 'eastern_plateau',
    KARNATAKA: 'southern_peninsular',
    KERALA: 'southern_peninsular',
    LADAKH: 'himalayan',
    LAKSHADWEEP: 'islands',
    'MADHYA PRADESH': 'eastern_plateau',
    MAHARASHTRA: 'western_coastal',
    MANIPUR: 'northeastern_hills',
    MEGHALAYA: 'northeastern_hills',
    MIZORAM: 'northeastern_hills',
    NAGALAND: 'northeastern_hills',
    ODISHA: 'eastern_plateau',
    PUDUCHERRY: 'metropolitan_union',
    PUNJAB: 'gangetic_plains',
    RAJASTHAN: 'arid_west',
    SIKKIM: 'himalayan',
    'TAMIL NADU': 'southern_peninsular',
    TELANGANA: 'southern_peninsular',
    TRIPURA: 'northeastern_hills',
    'UTTAR PRADESH': 'gangetic_plains',
    UTTARAKHAND: 'himalayan',
    'WEST BENGAL': 'gangetic_plains',
};

function replaceStateToken(text, stateDisplayName) {
    return String(text || '').replace(/\{state\}/g, stateDisplayName);
}

function getProfileForState(stateName) {
    const profileKey = STATE_PROFILE_MAP[stateName] || 'gangetic_plains';
    return PROFILE_LIBRARY[profileKey] || PROFILE_LIBRARY.gangetic_plains;
}

export function getCulturalContentForState(stateName) {
    const stateDisplayName = getCulturalStateDisplayName(stateName);
    const profile = getProfileForState(stateName);

    const categories = {};
    for (let i = 0; i < CULTURAL_CATEGORIES.length; i++) {
        const category = CULTURAL_CATEGORIES[i];
        const block = profile[category.id];
        categories[category.id] = {
            title: CATEGORY_TITLES[category.id],
            description: replaceStateToken(block?.description, stateDisplayName),
            highlightLabel: category.noteLabel,
            highlight: replaceStateToken(block?.highlight, stateDisplayName),
        };
    }

    return {
        intro: replaceStateToken(profile.intro, stateDisplayName),
        categories,
    };
}
