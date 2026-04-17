import { CULTURAL_CATEGORIES } from '../utils/culturalAssets';

const CULTURAL_CONTENT_SOURCE = {
    'Andaman and Nicobar': {
        dance: {
            name: 'Nicobari Community Dance',
            caption: 'Group performance traditions associated with island community gatherings.',
            highlightLabel: 'Cultural Note',
            highlightText: 'The visual appears to reference indigenous or archival island performance culture.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Tribal Ceremonial Attire',
            caption: 'Traditional dress with headgear and ornamentation linked to community identity.',
            highlightLabel: 'Dress Note',
            highlightText: 'The image suggests festive or ceremonial island attire rather than everyday wear.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Island Marine Landscape',
            caption: 'The image reads more as a coastal ecological scene than a distinct festival moment.',
            highlightLabel: 'Fallback',
            highlightText: 'Use a broad island celebration line here unless a more specific festival image is added.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Island Food Traditions',
            caption: 'The image does not clearly depict a specific dish and is better treated generically.',
            highlightLabel: 'Fallback',
            highlightText: 'A short seafood-and-coconut based cultural food line would fit safely.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Colonial-Era Island Architecture',
            caption: 'Built heritage here appears tied to old institutional or colonial structures.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be framed as layered island history rather than a single named monument.',
            image: 'heritage.jpg',
        },
    },
    'Andhra Pradesh': {
        dance: {
            name: 'Kuchipudi',
            caption: 'A classical dance tradition known for expressive storytelling and stylized movement.',
            highlightLabel: 'Signature Form',
            highlightText: 'The stage costume and pose strongly suggest a classical Telugu performance tradition.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Handloom Weaving Traditions',
            caption: 'The image centers weaving practice rather than a single garment form.',
            highlightLabel: 'Dress Note',
            highlightText: 'It is best framed around textile craft and loom-based attire production.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Festival Sweets and Lamp Rituals',
            caption: 'The image points to festive sweets and ceremonial offering culture.',
            highlightLabel: 'Festival Note',
            highlightText: 'This works well as a broad festival-foods-and-light motif rather than one exact event.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Dosa / Pesarattu Plate',
            caption: 'A griddle-based regional staple presented in a familiar South Indian style.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'The image reads as a breakfast or everyday plate rather than a ceremonial dish.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Temple Heritage',
            caption: 'The image appears to depict a major temple complex or sacred architectural site.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A safe framing is devotional architecture and pilgrimage heritage.',
            image: 'heritage.jpg',
        },
    },
    'Arunachal Pradesh': {
        dance: {
            name: 'Masked Folk Performance',
            caption: 'The image suggests a ritual or ceremonial dance with costume and mask elements.',
            highlightLabel: 'Performance Note',
            highlightText: 'This can be described as a visually rich festival-linked performance tradition.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Tribal Highland Attire',
            caption: 'Layered clothing and head-covering indicate region-specific community dress traditions.',
            highlightLabel: 'Dress Note',
            highlightText: 'The image is best framed around identity, climate, and community expression.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Monastery Festival Gathering',
            caption: 'The image appears connected to a Himalayan Buddhist religious or seasonal gathering.',
            highlightLabel: 'Festival Note',
            highlightText: 'Use a broad monastery-linked celebration framing unless you want to name a specific festival later.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Mountain Broth / Noodle Bowl',
            caption: 'The image reads as a highland-style warm dish rather than a precisely identifiable recipe.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A generic line around simple mountain food traditions will be safer here.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Monastery and Mountain Heritage',
            caption: 'The image emphasizes Himalayan built heritage set against dramatic terrain.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be positioned around monastic architecture and landscape memory.',
            image: 'heritage.jpg',
        },
    },
    Assam: {
        dance: {
            name: 'Bihu Dance',
            caption: 'A lively folk dance closely associated with seasonal celebration and Assamese identity.',
            highlightLabel: 'Signature Form',
            highlightText: 'The costume and seated dance posture strongly align with Bihu performance culture.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Mekhela Chador',
            caption: 'Traditional Assamese attire known for woven elegance and regional motifs.',
            highlightLabel: 'Dress Note',
            highlightText: 'The image suggests a classic handwoven festive presentation.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Bihu Gathering',
            caption: 'The group scene reflects community celebration tied to music, dance, and seasonal rhythm.',
            highlightLabel: 'Festival Note',
            highlightText: 'This can be cleanly framed around spring and harvest-linked festivity.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Black Rice',
            caption: 'The image appears to show a grain-centered Assamese staple or ingredient tradition.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This works better as a simple local-food identity marker than an elaborate dish caption.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Assamese Sacred / Historic Site',
            caption: 'The image seems to point toward regional architectural or sacred heritage.',
            highlightLabel: 'Heritage Note',
            highlightText: 'Use a broad built-and-cultural heritage framing if the exact site is uncertain.',
            image: 'heritage.jpg',
        },
    },
    Bihar: {
        dance: {
            name: 'Pagoda-Style Shrine Image',
            caption: 'The uploaded image appears architectural rather than a dance performance scene.',
            highlightLabel: 'Fallback',
            highlightText: 'Because the category and image do not align, use a broad cultural-performance line in UI if needed.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Stage Folk Performance Costume',
            caption: 'The image shows performance attire and movement rather than a standalone garment study.',
            highlightLabel: 'Dress Note',
            highlightText: 'It can be framed as costume traditions used in staged folk expression.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Festival Crowd Procession',
            caption: 'A mass gathering scene suggesting public celebration and devotional participation.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is better kept generic unless a specific event label is confirmed.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Regional Thali Plate',
            caption: 'The image presents a composed meal rather than one iconic single dish.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A broad local-plate framing will work better than over-guessing.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Historic Buddhist / Temple Heritage',
            caption: 'The image likely refers to a religious or historic architectural site.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can safely be linked to Bihar’s layered sacred and historical landscape.',
            image: 'heritage.jpg',
        },
    },
    Chandigarh: {
        dance: {
            name: 'Punjabi Folk Dance Performance',
            caption: 'A stage presentation with energetic group choreography and festive costume.',
            highlightLabel: 'Performance Note',
            highlightText: 'The visual reads as a public cultural-show format rather than a classical form.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Phulkari Textile Pattern',
            caption: 'The image foregrounds embroidered fabric and colorful geometric surface work.',
            highlightLabel: 'Dress Note',
            highlightText: 'This is best described through textile craft rather than a single garment type.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Harvest / Community Celebration',
            caption: 'The outdoor gathering suggests a rural or agrarian festive setting.',
            highlightLabel: 'Festival Note',
            highlightText: 'A broad community-celebration line is the safest fit here.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Chole Bhature',
            caption: 'A recognizable North Indian plate centered on puffed bread and chickpea curry.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This image is one of the clearer food identifications in the set.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Planned Urban Heritage',
            caption: 'The image appears to reference Chandigarh’s designed urban or civic landscape.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be framed around modernist city identity and civic planning.',
            image: 'heritage.jpg',
        },
    },
    Chhattisgarh: {
        dance: {
            name: 'Temple Heritage Scene',
            caption: 'The image appears architectural and does not strongly depict dance.',
            highlightLabel: 'Fallback',
            highlightText: 'Keep the UI line broad if you want the category to remain dance-led.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Textile and Handcraft Display',
            caption: 'The image points more toward regional craft objects and surface work.',
            highlightLabel: 'Dress Note',
            highlightText: 'A textile-craft framing is safer than naming one precise attire form.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Illuminated Festival Street',
            caption: 'The image suggests a public festive evening with decorated structures and lights.',
            highlightLabel: 'Festival Note',
            highlightText: 'This works well as a broad celebration-space caption.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Fast-Food Streetfront Image',
            caption: 'The image seems to show a storefront rather than a culturally specific dish.',
            highlightLabel: 'Fallback',
            highlightText: 'Use a generic regional-cuisine line unless the food image is replaced.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Stone Temple Heritage',
            caption: 'The image appears to refer to historic temple architecture and sculptural tradition.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be safely positioned as built heritage rooted in old shrine landscapes.',
            image: 'heritage.jpg',
        },
    },
    'Dadra and Nagar Haveli and Daman and Diu': {
        dance: {
            name: 'Archival Folk Dance Illustration',
            caption: 'The image resembles a historical or ethnographic depiction of group movement.',
            highlightLabel: 'Performance Note',
            highlightText: 'Use a broad community-dance framing rather than a specific named form.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Decorative Textile Panel',
            caption: 'The image foregrounds patterned cloth and ornamental surface tradition.',
            highlightLabel: 'Dress Note',
            highlightText: 'It is better read as textile culture than a clearly identifiable garment.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Island-Coastal Motif Display',
            caption: 'The image appears symbolic rather than a direct festival event photograph.',
            highlightLabel: 'Fallback',
            highlightText: 'A simple coastal celebration line will fit safely here.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Regional Curry Bowl',
            caption: 'The image shows a curry-based preparation but does not clearly identify the exact dish.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A broad coastal and western Indian food line would work here.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Fort / Coastal Built Heritage',
            caption: 'The heritage image appears to connect with older coastal architecture or fort settings.',
            highlightLabel: 'Heritage Note',
            highlightText: 'Frame it around Portuguese-influenced or maritime regional history if needed.',
            image: 'heritage.jpg',
        },
    },
    Delhi: {
        dance: {
            name: 'Kathak / Stage Classical Performance',
            caption: 'A visually stylized stage dance image with a classical North Indian feel.',
            highlightLabel: 'Performance Note',
            highlightText: 'This works best as a metro-stage cultural performance reference.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'School Uniform Procession',
            caption: 'The image depicts uniformed youth rather than a regional traditional dress form.',
            highlightLabel: 'Fallback',
            highlightText: 'If needed, use a broad civic-cultural identity line instead of naming attire too specifically.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Diya and Rangoli Setup',
            caption: 'The image strongly suggests a Diwali-style festive arrangement.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is one of the clearer festival visuals in the set.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Puri with Curry',
            caption: 'A familiar North Indian plate centered on fried bread and accompaniment.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This reads as festive or everyday comfort food rather than a niche specialty.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Monumental Urban Heritage',
            caption: 'The image appears to reference Delhi’s historic built landscape.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A safe framing is layered imperial, civic, and monumental heritage.',
            image: 'heritage.jpg',
        },
    },
    Goa: {
        dance: {
            name: 'Goan Folk Dance',
            caption: 'A group dance image with coordinated costume and public performance character.',
            highlightLabel: 'Performance Note',
            highlightText: 'This is best framed as a festive folk ensemble rather than over-specifying the form.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Vintage Coastal Attire',
            caption: 'The monochrome image suggests historical dress culture rather than a current festive garment photo.',
            highlightLabel: 'Dress Note',
            highlightText: 'This can be used as a heritage-linked dress reference.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Carnival / Public Festive Display',
            caption: 'The image suggests a public celebration space with tourism-facing visibility.',
            highlightLabel: 'Festival Note',
            highlightText: 'A carnival-style urban festivity reading fits well here.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Goan Rice-and-Curry Plate',
            caption: 'The image shows a plated meal rather than one sharply identifiable iconic item.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A broad coastal spice-and-seafood influenced food line would suit this visual.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Church / Colonial Heritage',
            caption: 'The image appears tied to Goa’s coastal architectural and colonial history.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be framed around churches, plazas, and built memory.',
            image: 'heritage.jpg',
        },
    },
    Gujarat: {
        dance: {
            name: 'Garba',
            caption: 'A vibrant folk dance associated with circular movement and festive community participation.',
            highlightLabel: 'Signature Form',
            highlightText: 'The costume, movement, and color language strongly point to Garba culture.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Chaniya Choli',
            caption: 'Festive embroidered attire with bright color and decorative surface work.',
            highlightLabel: 'Dress Note',
            highlightText: 'The image reads as performance or celebration wear rather than everyday dress.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Navratri Celebration',
            caption: 'The image suggests devotional festivity centered around ornament, color, and public worship.',
            highlightLabel: 'Festival Note',
            highlightText: 'This can be cleanly mapped to Navratri-linked celebration culture.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Dhokla / Gujarati Savory Plate',
            caption: 'A snack-style plate that visually aligns with familiar Gujarati food presentation.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is best treated as a light savory staple rather than a ceremonial dish.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Stepwell / Historic Masonry Heritage',
            caption: 'The image appears to point to stone-built historical architecture.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A safe heritage framing is stepwell, temple, or old urban stonework tradition.',
            image: 'heritage.jpg',
        },
    },
    Haryana: {
        dance: {
            name: 'Folk Performance Illustration',
            caption: 'The image looks like an artwork or stamp-based representation of regional performance culture.',
            highlightLabel: 'Performance Note',
            highlightText: 'Use a broad rural folk-dance line if you want to avoid overnaming.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Archival Traditional Attire',
            caption: 'The monochrome image shows historical dress presentation rather than a modern garment study.',
            highlightLabel: 'Dress Note',
            highlightText: 'This can be framed around older rural clothing traditions.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Community Procession',
            caption: 'The image depicts a gathering with crowd energy and shared celebration.',
            highlightLabel: 'Festival Note',
            highlightText: 'A broad mela or public festive gathering line would suit it well.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Roti / Flatbread Tradition',
            caption: 'The image centers a simple wheat-based staple closely tied to everyday regional food culture.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This works well as an everyday agrarian-food reference.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Civic / Historic Built Landscape',
            caption: 'The visual appears to reference a formal built site rather than a natural heritage scene.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad historical-site framing is safest unless the exact location is known.',
            image: 'heritage.jpg',
        },
    },
    'Himachal Pradesh': {
        dance: {
            name: 'Nati',
            caption: 'A group folk dance associated with hill communities and festive gatherings.',
            highlightLabel: 'Signature Form',
            highlightText: 'The line-up, dress, and performance posture strongly suggest Himachali folk dance culture.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Himachali Cap and Woolen Attire',
            caption: 'The portrait foregrounds mountain-region clothing and distinctive headgear.',
            highlightLabel: 'Dress Note',
            highlightText: 'The image is better read through climate, craft, and identity together.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Temple Floral Offering Display',
            caption: 'The image suggests a shrine-centered festive arrangement or ritual decoration.',
            highlightLabel: 'Festival Note',
            highlightText: 'This can be kept broad as a temple-linked celebration scene.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Siddu / Steamed Local Bread',
            caption: 'The rounded dough form suggests a hill-region staple or festive preparation.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A simple mountain-food line is safest if exact dish naming is uncertain.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Mountain Monastery / Shrine Heritage',
            caption: 'The image links architecture to a highland landscape setting.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This works as a built-and-mountain heritage reference.',
            image: 'heritage.jpg',
        },
    },
    'Jammu and Kashmir': {
        dance: {
            name: 'Horse-Riding Cultural Scene',
            caption: 'The image does not clearly depict dance and reads more as a regional lifestyle or festival moment.',
            highlightLabel: 'Fallback',
            highlightText: 'Keep the line broad if the category remains fixed as dance.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Traditional Pheran',
            caption: 'The image suggests layered Kashmiri attire suited to mountain climate and custom.',
            highlightLabel: 'Dress Note',
            highlightText: 'A climate-and-craft based line would fit well here.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Tulip Garden Season',
            caption: 'The image appears to show a seasonal floral gathering rather than a ritual festival.',
            highlightLabel: 'Festival Note',
            highlightText: 'This can be framed as a spring-season public cultural attraction.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Rogan Josh / Curry Dish',
            caption: 'A rich curry-based preparation visually aligned with Kashmiri cuisine.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is a relatively confident food identification compared with other entries.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Valley Landscape Heritage',
            caption: 'The heritage image appears to emphasize landscape identity over a single built monument.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be described as natural-cultural heritage tied to the valley setting.',
            image: 'heritage.jpg',
        },
    },
    Jharkhand: {
        dance: {
            name: 'Umbrella Folk Stage Performance',
            caption: 'The image shows a staged community performance with dramatic costume and props.',
            highlightLabel: 'Performance Note',
            highlightText: 'A broad folk-stage framing is safer than forcing a specific dance name.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Craft and Textile Display',
            caption: 'The image shows arranged objects or handcrafted material rather than one visible garment type.',
            highlightLabel: 'Dress Note',
            highlightText: 'A wider tribal-textile and handcraft framing suits this better.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Tree-Centered Community Gathering',
            caption: 'The image appears linked to an open-air ritual or public gathering space.',
            highlightLabel: 'Festival Note',
            highlightText: 'This works well as a broad community-festival caption.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Leaf-Plate Regional Meal',
            caption: 'The image suggests a local platter served with simple accompaniments.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'It is better treated as a regional food spread than as one precisely named dish.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Temple / Sacred Site Heritage',
            caption: 'The image likely references an older sacred or historically significant site.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad sacred-landscape framing is safest here.',
            image: 'heritage.jpg',
        },
    },
    Karnataka: {
        dance: {
            name: 'Yakshagana',
            caption: 'A theatrical dance-drama tradition marked by elaborate costume and expressive staging.',
            highlightLabel: 'Signature Form',
            highlightText: 'The costume styling strongly suggests Yakshagana or a related performance form.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Ilkal / Regional Handloom Drapes',
            caption: 'The image foregrounds woven cloth and layered textile arrangement.',
            highlightLabel: 'Dress Note',
            highlightText: 'A handloom-centered dress line is the strongest fit here.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Open-Ground Festival Gathering',
            caption: 'The image suggests a public cultural event with processional or fair-like character.',
            highlightLabel: 'Festival Note',
            highlightText: 'This works best as a broad mela or celebration-space caption.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Bisi Bele Bath / Rice Meal Spread',
            caption: 'The image shows a rice-centered meal with multiple accompaniments.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'The exact dish may vary, but the South Karnataka meal identity is clear enough.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Temple / Stone Architecture Heritage',
            caption: 'The visual appears to point toward Karnataka’s historic temple and masonry traditions.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be framed around old dynastic architecture and sacred sites.',
            image: 'heritage.jpg',
        },
    },
    Kerala: {
        dance: {
            name: 'Kathakali / Classical Dance-Drama',
            caption: 'A richly costumed performance tradition built on dramatic expression and storytelling.',
            highlightLabel: 'Signature Form',
            highlightText: 'The image strongly aligns with Kerala’s classical performance heritage.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Kasavu-Inspired Traditional Attire',
            caption: 'White or light-toned draped clothing with ceremonial elegance.',
            highlightLabel: 'Dress Note',
            highlightText: 'The image reads as festive traditional attire rather than everyday clothing.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Pookalam',
            caption: 'A floral floor design strongly associated with Onam celebration culture.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is one of the clearest festival-identifying images in the folder.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Sadya',
            caption: 'A banana-leaf meal presentation reflecting Kerala’s festive dining tradition.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This image clearly evokes the structured multi-item feast format.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Backwater and Temple Heritage',
            caption: 'The heritage image appears to blend natural setting with built cultural memory.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be framed around waterways, sacred sites, and landscape culture.',
            image: 'heritage.jpg',
        },
    },
    Ladakh: {
        dance: {
            name: 'Masked Monastic Dance',
            caption: 'The image suggests a ritual performance with costume and Buddhist visual vocabulary.',
            highlightLabel: 'Performance Note',
            highlightText: 'A monastery-festival dance framing is the strongest fit here.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Traditional Woolen Highland Garment',
            caption: 'The image shows a folded garment rather than a worn outfit, but clearly suggests high-altitude attire.',
            highlightLabel: 'Dress Note',
            highlightText: 'Use a broad climate-and-craft based description for the garment.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Monastery Courtyard Festival',
            caption: 'The image points to a Himalayan religious or community gathering in a monastery setting.',
            highlightLabel: 'Festival Note',
            highlightText: 'This can be described as a monastic seasonal celebration without overnaming.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Mountain Salad / Prepared Plate',
            caption: 'The image does not strongly identify one iconic Ladakhi dish.',
            highlightLabel: 'Fallback',
            highlightText: 'A broad highland-food line is safer than overcommitting to a dish name.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Monastery and Mountain Heritage',
            caption: 'The visual appears rooted in rocky terrain and Buddhist built heritage.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be framed around altitude, monastery architecture, and memory.',
            image: 'heritage.jpg',
        },
    },
    Lakshadweep: {
        dance: {
            name: 'Cultural Figure / Public Personality Image',
            caption: 'The uploaded image does not clearly function as a dance visual.',
            highlightLabel: 'Fallback',
            highlightText: 'Use a broad island performance line if the category must remain dance.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Symbolic Graphic Image',
            caption: 'The uploaded visual is not a dress photograph and appears mismatched to the category.',
            highlightLabel: 'Fallback',
            highlightText: 'A generic island-attire line will be safer until a better image is added.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Beach and Lagoon Festive Setting',
            caption: 'The image reads as coastal landscape rather than a specific festival scene.',
            highlightLabel: 'Festival Note',
            highlightText: 'Frame it as island celebration and seafront community life if needed.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Dried Fish Tradition',
            caption: 'The image appears to show preserved fish associated with coastal island food culture.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is a strong visual marker of marine-based everyday food tradition.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Island Coastal Heritage',
            caption: 'The image appears to emphasize seascape and island continuity more than a monument.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A natural-cultural heritage framing is the best fit.',
            image: 'heritage.jpg',
        },
    },
    'Madhya Pradesh': {
        dance: {
            name: 'Classical Dance Stage Performance',
            caption: 'A paired stage image suggesting a classical or semi-classical performance format.',
            highlightLabel: 'Performance Note',
            highlightText: 'This can be kept broad unless you want to map a specific named form later.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Dyed Textile / Fabric Tradition',
            caption: 'The image centers cloth display and color treatment rather than one garment silhouette.',
            highlightLabel: 'Dress Note',
            highlightText: 'A handloom or dyed-fabric framing suits the visual well.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Domestic / Courtyard Celebration',
            caption: 'The image shows a woman in a decorated setting that feels intimate and festive.',
            highlightLabel: 'Festival Note',
            highlightText: 'This works as a broad ritual-home celebration caption.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Poha',
            caption: 'The flattened rice texture strongly suggests a poha-style preparation.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is a relatively confident identification based on the food image.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Historic Temple / Monument Heritage',
            caption: 'The image appears to refer to major built heritage within the state.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad stone-temple and dynastic-architecture line will fit safely.',
            image: 'heritage.jpg',
        },
    },
    Maharashtra: {
        dance: {
            name: 'Stage Classical / Folk Performance',
            caption: 'The image shows a solo performer in a formal cultural stage setting.',
            highlightLabel: 'Performance Note',
            highlightText: 'This can be kept broad unless you want to map it to Lavani or another form after review.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Nauvari Saree / Draped Traditional Attire',
            caption: 'The image appears to foreground a formal regional saree presentation.',
            highlightLabel: 'Dress Note',
            highlightText: 'This works well as a ceremonial-attire reference.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Ganesh Festival Display',
            caption: 'The image strongly suggests a decorated Ganesh idol setting.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is one of the more identifiable festival images in the archive.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Vada Pav',
            caption: 'The image clearly resembles Maharashtra’s well-known street-food staple.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is a straightforward and useful food label for the UI.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Fort Heritage',
            caption: 'The image appears tied to stone fortification or hill-fort history.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A Maratha fort and landscape-heritage framing fits well here.',
            image: 'heritage.jpg',
        },
    },
    Manipur: {
        dance: {
            name: 'Manipuri Dance',
            caption: 'A classical dance image with layered costume and rounded visual form.',
            highlightLabel: 'Signature Form',
            highlightText: 'The costume silhouette strongly suggests Manipuri performance heritage.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Ceremonial Traditional Attire',
            caption: 'The dress image appears arranged in a ritual or display setting rather than worn on body.',
            highlightLabel: 'Dress Note',
            highlightText: 'This works as a ceremonial-attire reference without overnaming.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Traditional Group Ceremony',
            caption: 'The image suggests formal gathering, costume, and cultural presentation.',
            highlightLabel: 'Festival Note',
            highlightText: 'Use a broad community and ceremonial celebration line here.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Regional Broth / Noodle Bowl',
            caption: 'The food image suggests a warm everyday dish rather than one sharply recognizable specialty.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A simple local-bowl cuisine line is safest.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Sacred / Historic Landscape Heritage',
            caption: 'The image appears to refer to a formal landscaped site with cultural memory.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad historical-landscape framing is the safest fit.',
            image: 'heritage.jpg',
        },
    },
    Meghalaya: {
        dance: {
            name: 'Folk Dance Stage Performance',
            caption: 'The dance image suggests a staged cultural presentation with coordinated attire.',
            highlightLabel: 'Performance Note',
            highlightText: 'Keep it broad unless you want to map a specific Khasi or Garo dance later.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Traditional Tribal Attire',
            caption: 'The image shows formal ethnic dress with distinct headgear and ornament.',
            highlightLabel: 'Dress Note',
            highlightText: 'This is best framed around community identity and ceremonial presentation.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Drum and Performance Gathering',
            caption: 'The image emphasizes music-led community celebration with live performance.',
            highlightLabel: 'Festival Note',
            highlightText: 'This works well as a general festival-performance scene.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Layered Market Display',
            caption: 'The image does not clearly point to one iconic dish and may be better treated broadly.',
            highlightLabel: 'Fallback',
            highlightText: 'Use a generic hill-state cuisine line unless you want to manually relabel later.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Monastery / Hill Heritage',
            caption: 'The image appears to depict a hilltop or monastic architectural site.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad landscape-plus-built-heritage line fits best.',
            image: 'heritage.jpg',
        },
    },
    Mizoram: {
        dance: {
            name: 'Bamboo Dance / Group Folk Performance',
            caption: 'The image shows a synchronized group dance setting with strong stage identity.',
            highlightLabel: 'Signature Form',
            highlightText: 'A bamboo-dance style framing is the most intuitive cultural read here.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Striped Woven Textile',
            caption: 'The image foregrounds striped cloth patterns rather than a worn dress form.',
            highlightLabel: 'Dress Note',
            highlightText: 'This is best described through weaving and textile identity.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Public Parade / Gathering',
            caption: 'The image suggests a civic or public celebration rather than a tightly defined ritual event.',
            highlightLabel: 'Festival Note',
            highlightText: 'A broad communal festive assembly line is safest.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Stage Performance Image',
            caption: 'The uploaded image appears mismatched and does not clearly depict food.',
            highlightLabel: 'Fallback',
            highlightText: 'Use a generic Mizo cuisine line unless the source image is replaced.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Highland Landscape Heritage',
            caption: 'The heritage image appears to emphasize terrain and settlement continuity.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A landscape-centered heritage caption works best.',
            image: 'heritage.jpg',
        },
    },
    Nagaland: {
        dance: {
            name: 'Tribal Warrior Dance',
            caption: 'The image suggests a traditional performance with costume, props, and ceremonial energy.',
            highlightLabel: 'Performance Note',
            highlightText: 'A broad Naga warrior-dance framing fits well here.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Naga Traditional Attire',
            caption: 'The portrait foregrounds patterned ethnic clothing and ornamented styling.',
            highlightLabel: 'Dress Note',
            highlightText: 'This reads clearly as identity-rich ceremonial dress.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Hornbill-Style Festival Ground',
            caption: 'The wide field and crowd setup strongly suggest a large public cultural festival.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is best framed as a flagship tribal cultural gathering.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Preserved / Wrapped Local Food',
            caption: 'The image suggests a stored or wrapped traditional preparation rather than a plated dish.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A simple smoked, fermented, or preserved-food line would work safely.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Mountain Community Heritage',
            caption: 'The heritage image appears to emphasize natural terrain with settlement memory.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad landscape-and-community heritage framing is the best fit.',
            image: 'heritage.jpg',
        },
    },
    Odisha: {
        dance: {
            name: 'Odissi',
            caption: 'A classical dance form marked by sculptural posture and lyrical expression.',
            highlightLabel: 'Signature Form',
            highlightText: 'The costume and duet presentation strongly suggest Odissi performance tradition.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Ikat / Sambalpuri Textile',
            caption: 'The image foregrounds woven pattern and regional cloth identity.',
            highlightLabel: 'Dress Note',
            highlightText: 'A handloom-centered dress caption fits this image better than a narrow garment label.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Rath Yatra',
            caption: 'The image clearly shows chariot processions tied to Odisha’s major devotional festival tradition.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is one of the strongest category matches in the folder.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Pakhala Bhata / Rice-Based Dish',
            caption: 'The bowl image aligns with a simple rice-centered preparation linked to Odisha’s food identity.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'If needed, keep the line slightly broad but this looks close to a pakhala-style reference.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Temple Heritage',
            caption: 'The heritage image appears to point toward a major temple or sacred built landmark.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A temple-architecture framing is highly suitable here.',
            image: 'heritage.jpg',
        },
    },
    Puducherry: {
        dance: {
            name: 'Classical Dance Stage Performance',
            caption: 'A solo stage image suggesting a formal classical dance presentation.',
            highlightLabel: 'Performance Note',
            highlightText: 'Keep the dance label broad unless you want to assign Bharatanatyam explicitly later.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Vintage Portrait Attire',
            caption: 'The black-and-white dress image reads as historical portraiture rather than a current costume study.',
            highlightLabel: 'Dress Note',
            highlightText: 'This works well as a heritage-linked dress reference.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Coastal Festival View',
            caption: 'The image appears to show seafront urban space rather than a close festival ritual scene.',
            highlightLabel: 'Festival Note',
            highlightText: 'A broad coastal public celebration line is safest here.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Regional Coastal Cuisine',
            caption: 'The uploaded food image does not clearly isolate one iconic dish.',
            highlightLabel: 'Fallback',
            highlightText: 'A simple Franco-Tamil coastal cuisine line would work if needed.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Colonial Urban Heritage Map',
            caption: 'The heritage image appears cartographic or archival rather than a direct monument photo.',
            highlightLabel: 'Heritage Note',
            highlightText: 'This can be framed around planned colonial urban memory and seaside heritage.',
            image: 'heritage.jpg',
        },
    },
    Punjab: {
        dance: {
            name: 'Bhangra / Giddha Stage Performance',
            caption: 'A festive group performance with high-energy movement and bright costume.',
            highlightLabel: 'Signature Form',
            highlightText: 'This is a strong visual match for Punjabi folk dance culture.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Phulkari Textile',
            caption: 'The image foregrounds embroidered textile design rather than a full garment silhouette.',
            highlightLabel: 'Dress Note',
            highlightText: 'This is best described through fabric tradition and decorative craft.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Lohri Bonfire',
            caption: 'The flame image strongly suggests a bonfire-centered winter celebration.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is a clear and useful festival identity marker.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Makki di Roti / Sarson Pairing',
            caption: 'The image suggests a maize-flatbread centered Punjabi food presentation.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A winter-rural cuisine line would pair well with this image.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Sikh Sacred / Historic Site',
            caption: 'The image appears linked to an important Sikh or Punjabi heritage location.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad faith, memory, and architectural continuity framing works here.',
            image: 'heritage.jpg',
        },
    },
    Rajasthan: {
        dance: {
            name: 'Ghoomar / Folk Dance Performance',
            caption: 'A colorful folk dance image with swirling costume and group formation.',
            highlightLabel: 'Signature Form',
            highlightText: 'The visual strongly suggests Rajasthan’s celebratory dance vocabulary.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Ghagra-Choli',
            caption: 'Traditional festive attire with layered drape, color, and ornament.',
            highlightLabel: 'Dress Note',
            highlightText: 'The image clearly supports a ceremonial dress reading.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Decorated Camel Procession',
            caption: 'The image suggests fairground or desert-festival spectacle with animal adornment.',
            highlightLabel: 'Festival Note',
            highlightText: 'A Pushkar-style or desert fair framing would fit well.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Laddu / Sweet Traditions',
            caption: 'The food image appears to center sweet preparation rather than a full meal.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'If you want to stay safer, frame it as festive sweets rather than naming one dish too narrowly.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Fort / Palace Heritage',
            caption: 'The image appears to reference Rajasthan’s monumental architecture.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad fort-and-palace line is highly suitable here.',
            image: 'heritage.jpg',
        },
    },
    Sikkim: {
        dance: {
            name: 'Masked Monastic Performance',
            caption: 'The image suggests a ritual Himalayan dance tradition with costume emphasis.',
            highlightLabel: 'Performance Note',
            highlightText: 'A monastery-linked dance framing is the strongest fit.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Traditional Highland Attire',
            caption: 'The monochrome image appears to show historical or formal ethnic clothing.',
            highlightLabel: 'Dress Note',
            highlightText: 'A broad hill-community dress line is safest here.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Monastery Courtyard Gathering',
            caption: 'The image points toward a Buddhist festival or religious community event.',
            highlightLabel: 'Festival Note',
            highlightText: 'Use a monastery-festival line rather than naming an exact event unless confirmed.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Momos',
            caption: 'The image clearly shows dumplings served with accompaniments.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is one of the clearest food labels in the set.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Monastery and Mountain Heritage',
            caption: 'The heritage image appears tied to highland sacred architecture and landscape.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A mountain-monastery continuity line works best.',
            image: 'heritage.jpg',
        },
    },
    'Tamil Nadu': {
        dance: {
            name: 'Bharatanatyam',
            caption: 'A classical solo dance form known for geometric posture and expressive storytelling.',
            highlightLabel: 'Signature Form',
            highlightText: 'The costume and mudra-rich stage visual strongly suggest Bharatanatyam.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Silk Saree Display',
            caption: 'The image foregrounds folded and stacked textiles rather than a worn attire image.',
            highlightLabel: 'Dress Note',
            highlightText: 'This fits best as a saree-and-weaving heritage caption.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Ritual Pot / Domestic Festival Scene',
            caption: 'The image suggests a household festive ritual, possibly harvest-linked.',
            highlightLabel: 'Festival Note',
            highlightText: 'A Pongal-adjacent celebration line may fit, but keep it broad if uncertain.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Idli with Chutneys',
            caption: 'A familiar South Indian breakfast plate centered on soft steamed rice cakes.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is a clear and user-friendly food label.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Temple / Sacred Architecture Heritage',
            caption: 'The heritage image appears rooted in built temple culture.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A Dravidian temple-heritage framing would fit well.',
            image: 'heritage.jpg',
        },
    },
    Telangana: {
        dance: {
            name: 'Group Folk Dance',
            caption: 'The stage image suggests a coordinated folk performance with festive costume and movement.',
            highlightLabel: 'Performance Note',
            highlightText: 'A broad folk-dance label is safer than forcing one exact form.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Traditional Rural Attire Portrait',
            caption: 'The image appears to show everyday or identity-linked dress rather than a couture display.',
            highlightLabel: 'Dress Note',
            highlightText: 'Keep the caption grounded in local drape and material tradition.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Decorated Festival Figure',
            caption: 'The image strongly suggests a ritual or community festive procession figure.',
            highlightLabel: 'Festival Note',
            highlightText: 'This can be framed as a public seasonal celebration image.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Biryani',
            caption: 'A rice-based platter image that aligns well with Hyderabad-linked culinary identity.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is a practical and high-recognition label for the UI.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Fort / Monument Heritage',
            caption: 'The heritage image appears to reference older architectural history.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad Deccan built-heritage framing is the safest fit.',
            image: 'heritage.jpg',
        },
    },
    Tripura: {
        dance: {
            name: 'Stage Folk Dance Ensemble',
            caption: 'The image shows a group performance with synchronized festive energy.',
            highlightLabel: 'Performance Note',
            highlightText: 'A broad Tripuri folk-dance caption is safer than overnaming.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Traditional Ethnic Attire',
            caption: 'The portrait image foregrounds regional dress with woven pattern emphasis.',
            highlightLabel: 'Dress Note',
            highlightText: 'This can be framed around identity-rich ceremonial clothing.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Decorated Public Celebration Ground',
            caption: 'The wide scene appears to show a structured event or ceremonial public setup.',
            highlightLabel: 'Festival Note',
            highlightText: 'Keep the label broad unless you want to manually map the exact festival later.',
            image: 'festival.png',
        },
        food: {
            name: 'Leaf-Based Traditional Meal',
            caption: 'The image suggests a regional spread with greens and multiple side elements.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'A broad indigenous food-tradition line suits it best.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Palace / Historic Architecture',
            caption: 'The heritage image appears to show a formal historic structure.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A palace-and-royal-memory framing would work well here.',
            image: 'heritage.jpg',
        },
    },
    'Uttar Pradesh': {
        dance: {
            name: 'Kathak / Classical Stage Performance',
            caption: 'The image suggests a classical solo stage tradition with strong gesture and costume emphasis.',
            highlightLabel: 'Signature Form',
            highlightText: 'Kathak is the strongest fit for this visual and region.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Chikankari Embroidery',
            caption: 'The close-up image foregrounds delicate stitched surface detail rather than a full outfit.',
            highlightLabel: 'Dress Note',
            highlightText: 'This is best read through embroidery craft and textile heritage.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Mass Riverfront Gathering',
            caption: 'The image suggests a major pilgrimage or sacred-river festival setting.',
            highlightLabel: 'Festival Note',
            highlightText: 'A broad mela or ritual bathing gathering line would fit very well.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Petha',
            caption: 'The translucent cubed sweet is a strong visual match for petha.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is one of the clearest dish identifications in the archive.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Monument / Minaret Heritage',
            caption: 'The heritage image appears to show a major Mughal or historic built site.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad monumental-architecture line is the safest fit if you do not want to name the site exactly.',
            image: 'heritage.jpg',
        },
    },
    Uttarakhand: {
        dance: {
            name: 'Folk Performance Illustration',
            caption: 'The dance image appears to be an artwork rather than a live stage photograph.',
            highlightLabel: 'Performance Note',
            highlightText: 'A broad mountain folk-dance line fits best here.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Himalayan Traditional Attire',
            caption: 'The portrait image foregrounds mountain dress and distinctive headwear.',
            highlightLabel: 'Dress Note',
            highlightText: 'This can be framed through climate, community, and woven identity.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Crowded Devotional Gathering',
            caption: 'The image suggests a large pilgrimage-linked or temple-linked public festival scene.',
            highlightLabel: 'Festival Note',
            highlightText: 'A broad hill-pilgrimage celebration line is the most suitable fit.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Traditional Uttarakhand Thali',
            caption: 'A leaf-plate style meal image suggesting a regional spread rather than one dish alone.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This works well as a broad mountain-food identity card.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Himalayan Landscape Heritage',
            caption: 'The image appears to emphasize natural and sacred landscape rather than a single monument.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A pilgrimage-and-mountain continuity framing would fit well.',
            image: 'heritage.jpg',
        },
    },
    'West Bengal': {
        dance: {
            name: 'Masked Folk Stage Performance',
            caption: 'The image suggests a stylized group dance with strong theatrical costume identity.',
            highlightLabel: 'Performance Note',
            highlightText: 'A broad folk-theatre or masked-dance line is safest here.',
            image: 'dance.jpg',
        },
        dress: {
            name: 'Terracotta / Textile Heritage Panel',
            caption: 'The image appears more like a craft or architectural panel than a direct dress photograph.',
            highlightLabel: 'Fallback',
            highlightText: 'Use a broad textile-and-craft line if the category remains fixed as dress.',
            image: 'dress.jpg',
        },
        festival: {
            name: 'Durga Puja Idol Display',
            caption: 'The image clearly suggests a Durga Puja shrine or idol-setting visual.',
            highlightLabel: 'Festival Note',
            highlightText: 'This is one of the strongest and most useful festival images in the collection.',
            image: 'festival.jpg',
        },
        food: {
            name: 'Rasgulla / Rosogolla',
            caption: 'The white syrup-soaked sweets are a strong visual match for Bengal’s iconic dessert tradition.',
            highlightLabel: 'Cuisine Note',
            highlightText: 'This is a clear and high-recognition food label for the UI.',
            image: 'food.jpg',
        },
        heritage: {
            name: 'Illuminated Urban Heritage',
            caption: 'The heritage image appears to show a lit built structure or civic landmark at night.',
            highlightLabel: 'Heritage Note',
            highlightText: 'A broad colonial-urban and cultural-memory framing works well here.',
            image: 'heritage.jpg',
        },
    },
};

const STATE_KEY_ALIASES = {
    'nct of delhi': 'Delhi',
    delhi: 'Delhi',
    'jammu and kashmir': 'Jammu and Kashmir',
    'jammu kashmir': 'Jammu and Kashmir',
    'jammu & kashmir': 'Jammu and Kashmir',
    'andaman and nicobar islands': 'Andaman and Nicobar',
    'andaman & nicobar islands': 'Andaman and Nicobar',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra & nagar haveli and daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
    orissa: 'Odisha',
};

const FALLBACK_CAPTIONS = {
    dance: 'A regional performance tradition connected to community celebration.',
    dress: 'A traditional attire and textile expression associated with local identity.',
    festival: 'A public celebration context linked to local social and ritual life.',
    food: 'A regional food tradition reflecting everyday and festive culinary practice.',
    heritage: 'A heritage marker connected to built, sacred, or landscape memory.',
};

const FALLBACK_HIGHLIGHTS = {
    dance: 'Use a broad performance note when a specific dance reference is unavailable.',
    dress: 'Use a concise dress-context note when exact attire detail is uncertain.',
    festival: 'Use a concise festival-context note when event identity is not explicit.',
    food: 'Use a concise cuisine note when one exact dish is not clearly identifiable.',
    heritage: 'Use a concise heritage-context note when site details are uncertain.',
};

function normalizeStateKey(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const NORMALIZED_STATE_INDEX = Object.keys(CULTURAL_CONTENT_SOURCE).reduce(function buildIndex(acc, stateKey) {
    acc[normalizeStateKey(stateKey)] = stateKey;
    return acc;
}, {});

function toFallbackIntro(stateDisplayName) {
    return `A curated cultural snapshot of ${stateDisplayName} across dance, dress, festival, food, and heritage.`;
}

function toSafeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function findStateContentKey(stateName) {
    const normalized = normalizeStateKey(stateName);
    if (!normalized) return null;

    const aliasValue = STATE_KEY_ALIASES[normalized];
    const aliasNormalized = aliasValue ? normalizeStateKey(aliasValue) : null;

    return NORMALIZED_STATE_INDEX[normalized] || NORMALIZED_STATE_INDEX[aliasNormalized] || null;
}

export function getCulturalContentForState(stateName) {
    const stateKey = findStateContentKey(stateName);
    const sourceState = stateKey ? CULTURAL_CONTENT_SOURCE[stateKey] : null;
    const stateDisplayName = stateKey || String(stateName || '').trim() || 'Selected State';

    const categories = {};

    for (let i = 0; i < CULTURAL_CATEGORIES.length; i++) {
        const category = CULTURAL_CATEGORIES[i];
        const sourceCategory = sourceState?.[category.id] || null;

        categories[category.id] = {
            title: toSafeString(sourceCategory?.name) || category.title,
            description: toSafeString(sourceCategory?.caption) || FALLBACK_CAPTIONS[category.id],
            highlightLabel: toSafeString(sourceCategory?.highlightLabel) || 'Cultural Note',
            highlight: toSafeString(sourceCategory?.highlightText) || FALLBACK_HIGHLIGHTS[category.id],
            image: toSafeString(sourceCategory?.image) || '',
        };
    }

    const introAnchorName =
        categories.dance.title && categories.dance.title !== 'Dance'
            ? categories.dance.title
            : categories.festival.title && categories.festival.title !== 'Festival'
                ? categories.festival.title
                : '';

    const intro = introAnchorName
        ? `Featuring ${introAnchorName} and four other cultural dimensions in ${stateDisplayName}.`
        : toFallbackIntro(stateDisplayName);

    return {
        stateDisplayName,
        stateKey: stateKey || '',
        intro,
        categories,
    };
}
