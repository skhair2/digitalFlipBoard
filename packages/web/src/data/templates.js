/**
 * Template Library for Digital FlipBoard
 * 50 Pre-filled templates across various categories
 */

const generateGridLayout = (text, rows = 6, cols = 22, color = null) => {
    const total = rows * cols;
    const grid = Array(total).fill({ char: ' ', color: null });
    
    // Simple centering logic
    const lines = text.toUpperCase().split('\n');
    const startRow = Math.max(0, Math.floor((rows - lines.length) / 2));
    
    lines.forEach((line, i) => {
        if (i + startRow >= rows) return;
        const trimmed = line.substring(0, cols);
        const startCol = Math.max(0, Math.floor((cols - trimmed.length) / 2));
        
        for (let j = 0; j < trimmed.length; j++) {
            const index = (i + startRow) * cols + (j + startCol);
            if (index < total) {
                grid[index] = { char: trimmed[j], color };
            }
        }
    });
    
    return grid;
};

export const TEMPLATE_CATEGORIES = [
    'All',
    'Welcome',
    'Business',
    'Events',
    'Quotes',
    'Status',
    'Fun'
];

export const TEMPLATES = [
    // --- WELCOME (10) ---
    {
        id: 'w1',
        name: 'Classic Welcome',
        category: 'Welcome',
        description: 'A warm welcome for any occasion',
        layout: generateGridLayout('WELCOME\nTO OUR\nHOME'),
        tags: ['welcome', 'home']
    },
    {
        id: 'w2',
        name: 'Guest Welcome',
        category: 'Welcome',
        description: 'Perfect for Airbnb or guest rooms',
        layout: generateGridLayout('WELCOME\nDEAR GUEST\nENJOY YOUR STAY'),
        tags: ['welcome', 'guest']
    },
    {
        id: 'w3',
        name: 'Office Welcome',
        category: 'Welcome',
        description: 'Professional welcome for visitors',
        layout: generateGridLayout('WELCOME TO\nDIGITAL FLIP\nHEADQUARTERS'),
        tags: ['welcome', 'office']
    },
    {
        id: 'w4',
        name: 'Hotel Lobby',
        category: 'Welcome',
        description: 'Elegant hotel greeting',
        layout: generateGridLayout('WELCOME TO\nTHE GRAND\nRESORT'),
        tags: ['welcome', 'hotel']
    },
    {
        id: 'w5',
        name: 'New Member',
        category: 'Welcome',
        description: 'Greeting for new team members',
        layout: generateGridLayout('WELCOME\nTO THE TEAM\nGLAD YOU ARE HERE'),
        tags: ['welcome', 'team']
    },
    {
        id: 'w6',
        name: 'Store Opening',
        category: 'Welcome',
        description: 'Grand opening greeting',
        layout: generateGridLayout('WELCOME\nWE ARE\nNOW OPEN'),
        tags: ['welcome', 'retail']
    },
    {
        id: 'w7',
        name: 'Airport Pickup',
        category: 'Welcome',
        description: 'Classic airport sign style',
        layout: generateGridLayout('WELCOME HOME\nWE MISSED\nYOU'),
        tags: ['welcome', 'family']
    },
    {
        id: 'w8',
        name: 'Conference Greeting',
        category: 'Welcome',
        description: 'Event attendee welcome',
        layout: generateGridLayout('WELCOME\nATTENDEES\nTECH CONF 2025'),
        tags: ['welcome', 'event']
    },
    {
        id: 'w9',
        name: 'Morning Greeting',
        category: 'Welcome',
        description: 'Start the day right',
        layout: generateGridLayout('GOOD MORNING\nWELCOME TO\nA NEW DAY'),
        tags: ['welcome', 'morning']
    },
    {
        id: 'w10',
        name: 'VIP Welcome',
        category: 'Welcome',
        description: 'Special greeting for VIPs',
        layout: generateGridLayout('WELCOME\nOUR SPECIAL\nVIP GUEST'),
        tags: ['welcome', 'vip']
    },

    // --- BUSINESS (10) ---
    {
        id: 'b1',
        name: 'Coffee Menu',
        category: 'Business',
        description: 'Simple cafe menu',
        layout: generateGridLayout('LATTE .... $4\nMOCHA .... $5\nTEA ...... $3'),
        tags: ['business', 'cafe', 'menu']
    },
    {
        id: 'b2',
        name: 'Open Hours',
        category: 'Business',
        description: 'Store operating hours',
        layout: generateGridLayout('OPEN DAILY\n09:00 AM\nTO 08:00 PM'),
        tags: ['business', 'hours']
    },
    {
        id: 'b3',
        name: 'Sale Announcement',
        category: 'Business',
        description: 'Flash sale alert',
        layout: generateGridLayout('FLASH SALE\n50% OFF\nTODAY ONLY'),
        tags: ['business', 'sale']
    },
    {
        id: 'b4',
        name: 'WiFi Password',
        category: 'Business',
        description: 'Share WiFi details easily',
        layout: generateGridLayout('GUEST WIFI\nPASS: FLIP2025\nENJOY!'),
        tags: ['business', 'wifi']
    },
    {
        id: 'b5',
        name: 'Meeting in Progress',
        category: 'Business',
        description: 'Office status indicator',
        layout: generateGridLayout('MEETING\nIN PROGRESS\nDO NOT DISTURB'),
        tags: ['business', 'office']
    },
    {
        id: 'b6',
        name: 'Lunch Special',
        category: 'Business',
        description: 'Daily restaurant special',
        layout: generateGridLayout('TODAY SPECIAL\nTRUFFLE PASTA\n$18.99'),
        tags: ['business', 'food']
    },
    {
        id: 'b7',
        name: 'Next Appointment',
        category: 'Business',
        description: 'Service business status',
        layout: generateGridLayout('NEXT APPT\nAT 02:30 PM\nPLEASE WAIT'),
        tags: ['business', 'service']
    },
    {
        id: 'b8',
        name: 'Follow Us',
        category: 'Business',
        description: 'Social media promo',
        layout: generateGridLayout('FOLLOW US\n@FLIPBOARD\nON INSTAGRAM'),
        tags: ['business', 'social']
    },
    {
        id: 'b9',
        name: 'Out of Office',
        category: 'Business',
        description: 'Temporary closure',
        layout: generateGridLayout('OUT OF OFFICE\nBACK ON\nMONDAY'),
        tags: ['business', 'status']
    },
    {
        id: 'b10',
        name: 'New Arrival',
        category: 'Business',
        description: 'Product launch alert',
        layout: generateGridLayout('NEW ARRIVAL\nCHECK OUT OUR\nLATEST GEAR'),
        tags: ['business', 'retail']
    },

    // --- EVENTS (10) ---
    {
        id: 'e1',
        name: 'Happy Birthday',
        category: 'Events',
        description: 'Classic birthday greeting',
        layout: generateGridLayout('HAPPY\nBIRTHDAY\nTO YOU!'),
        tags: ['event', 'birthday']
    },
    {
        id: 'e2',
        name: 'Wedding Welcome',
        category: 'Events',
        description: 'Elegant wedding sign',
        layout: generateGridLayout('WELCOME TO\nTHE WEDDING OF\nALICE & BOB'),
        tags: ['event', 'wedding']
    },
    {
        id: 'e3',
        name: 'Game Night',
        category: 'Events',
        description: 'Fun social gathering',
        layout: generateGridLayout('IT IS\nGAME NIGHT!\nLET US PLAY'),
        tags: ['event', 'fun']
    },
    {
        id: 'e4',
        name: 'Movie Night',
        category: 'Events',
        description: 'Home cinema vibe',
        layout: generateGridLayout('NOW SHOWING\nINTERSTELLAR\nSTARTING NOW'),
        tags: ['event', 'movie']
    },
    {
        id: 'e5',
        name: 'Happy New Year',
        category: 'Events',
        description: 'Holiday celebration',
        layout: generateGridLayout('HAPPY\nNEW YEAR\n2026'),
        tags: ['event', 'holiday']
    },
    {
        id: 'e6',
        name: 'Merry Christmas',
        category: 'Events',
        description: 'Festive greeting',
        layout: generateGridLayout('MERRY\nCHRISTMAS\nHO HO HO'),
        tags: ['event', 'holiday']
    },
    {
        id: 'e7',
        name: 'Graduation',
        category: 'Events',
        description: 'Celebrate achievement',
        layout: generateGridLayout('CONGRATS\nGRADUATE!\nCLASS OF 2025'),
        tags: ['event', 'celebration']
    },
    {
        id: 'e8',
        name: 'Baby Shower',
        category: 'Events',
        description: 'Sweet event greeting',
        layout: generateGridLayout('WELCOME TO\nTHE BABY\nSHOWER'),
        tags: ['event', 'celebration']
    },
    {
        id: 'e9',
        name: 'Dinner Party',
        category: 'Events',
        description: 'Elegant dinner host',
        layout: generateGridLayout('DINNER IS\nSERVED\nBON APPETIT'),
        tags: ['event', 'food']
    },
    {
        id: 'e10',
        name: 'Party Time',
        category: 'Events',
        description: 'High energy greeting',
        layout: generateGridLayout('LET US\nPARTY!\nDRINKS ON US'),
        tags: ['event', 'fun']
    },

    // --- QUOTES (10) ---
    {
        id: 'q1',
        name: 'Stay Hungry',
        category: 'Quotes',
        description: 'Steve Jobs inspiration',
        layout: generateGridLayout('STAY HUNGRY\nSTAY FOOLISH\n- STEVE JOBS'),
        tags: ['quote', 'inspiration']
    },
    {
        id: 'q2',
        name: 'Just Do It',
        category: 'Quotes',
        description: 'Motivational mantra',
        layout: generateGridLayout('JUST\nDO IT\nMAKE IT HAPPEN'),
        tags: ['quote', 'motivation']
    },
    {
        id: 'q3',
        name: 'Be Kind',
        category: 'Quotes',
        description: 'Simple reminder',
        layout: generateGridLayout('IN A WORLD\nWHERE YOU CAN\nBE ANYTHING\nBE KIND'),
        tags: ['quote', 'kindness']
    },
    {
        id: 'q4',
        name: 'Dream Big',
        category: 'Quotes',
        description: 'Aspirational quote',
        layout: generateGridLayout('DREAM BIG\nWORK HARD\nSTAY HUMBLE'),
        tags: ['quote', 'success']
    },
    {
        id: 'q5',
        name: 'Carpe Diem',
        category: 'Quotes',
        description: 'Seize the day',
        layout: generateGridLayout('CARPE DIEM\nSEIZE THE DAY\nLIVE NOW'),
        tags: ['quote', 'latin']
    },
    {
        id: 'q6',
        name: 'Keep Going',
        category: 'Quotes',
        description: 'Persistence quote',
        layout: generateGridLayout('IT DOES NOT\nMATTER HOW SLOW\nYOU GO AS LONG\nAS YOU DO NOT STOP'),
        tags: ['quote', 'persistence']
    },
    {
        id: 'q7',
        name: 'Think Different',
        category: 'Quotes',
        description: 'Creative inspiration',
        layout: generateGridLayout('THINK\nDIFFERENT\nBE UNIQUE'),
        tags: ['quote', 'creativity']
    },
    {
        id: 'q8',
        name: 'Good Vibes',
        category: 'Quotes',
        description: 'Positive energy',
        layout: generateGridLayout('GOOD VIBES\nONLY\nPOSITIVE MIND'),
        tags: ['quote', 'positivity']
    },
    {
        id: 'q9',
        name: 'Focus',
        category: 'Quotes',
        description: 'Productivity reminder',
        layout: generateGridLayout('FOCUS ON\nTHE GOAL\nNOT THE OBSTACLE'),
        tags: ['quote', 'focus']
    },
    {
        id: 'q10',
        name: 'Adventure',
        category: 'Quotes',
        description: 'Travel inspiration',
        layout: generateGridLayout('ADVENTURE\nIS OUT THERE\nGO FIND IT'),
        tags: ['quote', 'travel']
    },

    // --- STATUS (10) ---
    {
        id: 's1',
        name: 'System Online',
        category: 'Status',
        description: 'Tech status indicator',
        layout: generateGridLayout('SYSTEM\nSTATUS: ONLINE\nALL GREEN'),
        tags: ['status', 'tech']
    },
    {
        id: 's2',
        name: 'Loading...',
        category: 'Status',
        description: 'Classic loading screen',
        layout: generateGridLayout('LOADING\nPLEASE WAIT\n[||||||    ]'),
        tags: ['status', 'wait']
    },
    {
        id: 's3',
        name: 'On Air',
        category: 'Status',
        description: 'Studio recording sign',
        layout: generateGridLayout('ON AIR\nRECORDING\nSILENCE PLEASE'),
        tags: ['status', 'studio']
    },
    {
        id: 's4',
        name: 'Battery Low',
        category: 'Status',
        description: 'Funny tech status',
        layout: generateGridLayout('BATTERY LOW\nNEED COFFEE\nIMMEDIATELY'),
        tags: ['status', 'funny']
    },
    {
        id: 's5',
        name: 'Weather: Sunny',
        category: 'Status',
        description: 'Daily weather update',
        layout: generateGridLayout('WEATHER\nSUNNY 25C\nPERFECT DAY'),
        tags: ['status', 'weather']
    },
    {
        id: 's6',
        name: 'Flight Delayed',
        category: 'Status',
        description: 'Authentic airport vibe',
        layout: generateGridLayout('FLIGHT BA123\nSTATUS: DELAYED\nNEW TIME 10:30'),
        tags: ['status', 'airport']
    },
    {
        id: 's7',
        name: 'Now Playing',
        category: 'Status',
        description: 'Music status',
        layout: generateGridLayout('NOW PLAYING\nBOHEMIAN RHAPSODY\nQUEEN'),
        tags: ['status', 'music']
    },
    {
        id: 's8',
        name: 'Stock Market',
        category: 'Status',
        description: 'Financial update',
        layout: generateGridLayout('NASDAQ +1.2%\nBTC $95,000\nBULL MARKET'),
        tags: ['status', 'finance']
    },
    {
        id: 's9',
        name: 'Do Not Disturb',
        category: 'Status',
        description: 'Privacy indicator',
        layout: generateGridLayout('DO NOT\nDISTURB\nGENIUS AT WORK'),
        tags: ['status', 'privacy']
    },
    {
        id: 's10',
        name: 'Success',
        category: 'Status',
        description: 'Achievement unlocked',
        layout: generateGridLayout('MISSION\nACCOMPLISHED\nSUCCESS!'),
        tags: ['status', 'win']
    }
];
