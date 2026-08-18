export const SYMBOLS={
diamond:"◇",wave:"⌁",triangle:"△",star:"✦",cube:"⌬",sun:"☼",spire:"◈",moon:"☾",
serpent:"∿",obelisk:"▴",spiral:"◎",key:"⌯",horizon:"◌",gate:"⊙",eye:"◉",crown:"⌃"
};

export const TEAM=[
{name:"Colonel Jack O'Dell",role:"Teamleitung",traits:"pragmatisch, trocken, entscheidet schnell",health:"einsatzbereit"},
{name:"Captain Kim Calder",role:"Astrophysik und Systeme",traits:"analytisch, technisch, vorsichtig bei Energiequellen",health:"einsatzbereit"},
{name:"Dr. David Jaxon",role:"Archäologie und Sprache",traits:"kulturell sensibel, erkennt Muster und Warnungen",health:"einsatzbereit"},
{name:"Tae'Khan",role:"Außerweltlicher Verbündeter",traits:"direkt, erfahren, erkennt alte Fraktionszeichen",health:"einsatzbereit"}
];

export const WORLDS=[
{id:"px761",code:"PX-761",unknownName:"Unbekannte Zielwelt",revealedName:"Verlassene Tempelanlage",status:"Adresse stabil",scanClass:"world-temple",address:["spire","sun","diamond","triangle","star","cube","wave"],profile:{environment:"atembar",terrain:"kalte Steinstrukturen",structures:"große künstliche Formen",energy:"schwach, geordnet",life:"keine eindeutigen Lebenszeichen",signature:"keine aktive Formation"},rewards:{materials:[1,3],research:[2,4]}},
{id:"px204",code:"PX-204",unknownName:"Unbekannte Zielwelt",revealedName:"Tal der schwarzen Sonne",status:"Adresse stabil",scanClass:"world-valley",address:["diamond","wave","triangle","star","cube","sun","spire"],profile:{environment:"atembar",terrain:"dunkle mineralische Oberfläche",structures:"bewegliche Wärmeschatten",energy:"periodisch",life:"mehrere Signaturen",signature:"mögliche organisierte Präsenz nahe der Austrittszone"},rewards:{materials:[2,5],research:[2,5]}},
{id:"px118",code:"PX-118",unknownName:"Unbekannte Zielwelt",revealedName:"Eisarchiv",status:"Verbindung möglich",scanClass:"world-ice",address:["moon","triangle","cube","spiral","spire","diamond","star"],profile:{environment:"dünn, aber atembar",terrain:"vereiste Oberfläche",structures:"unterirdische Geometrie",energy:"stark, tief unter der Oberfläche",life:"keine eindeutigen biologischen Signale",signature:"nichtbiologische Bewegung möglich"},blocker:{requires:"threshold_eye",text:"Versiegelter Tiefenzugang reagiert auf ein fehlendes Relikt."},rewards:{materials:[1,3],research:[3,6]}},
{id:"px392",code:"PX-392",unknownName:"Unbekannte Zielwelt",revealedName:"Mondruinen am Flutmeer",status:"Adresse instabil",scanClass:"world-moon",address:["cube","diamond","sun","eye","wave","obelisk","spire"],profile:{environment:"atembar, salzhaltig",terrain:"Felsplattformen und Flutbecken",structures:"periodisch freigelegte Ruinen",energy:"flackernd",life:"schwach unterhalb der Oberfläche",signature:"keine stabile Präsenz"},rewards:{materials:[3,6],research:[1,4]}},
{id:"px441",code:"PX-441",unknownName:"Unbekannte Zielwelt",revealedName:"Aschehimmel",status:"Adresse unvollständig",scanClass:"world-ash",address:["triangle","crown","wave","diamond","horizon","star","gate"],profile:{environment:"nicht atembar",terrain:"Aschestürme",structures:"unbekannt",energy:"instabil",life:"nicht verifiziert",signature:"keine Daten"},lockedText:"Benötigt später spezielle Atmosphärenausrüstung.",rewards:{materials:[0,0],research:[0,0]}}
];

export const EQUIPMENT=[
{id:"scanner",name:"Tragbarer Feldscanner",category:"Scanner",description:"Erkennt verborgene Strukturen, Energiepfade und Anomalien in Ruinen oder unterirdischen Anlagen.",tags:["analyse","ruinen","energie"],unlocked:true},
{id:"translator",name:"Xenolinguistisches Modul",category:"Übersetzung",description:"Verbessert die Deutung von Symbolen, Warnungen und diplomatischen Erstkontakten.",tags:["sprache","kultur","diplomatie"],unlocked:true},
{id:"medkit",name:"Expeditions-Medkit",category:"Medizin",description:"Stabilisiert Verletzungen und kann Missionen nach Zwischenfällen verlängern.",tags:["medizin","team","notfall"],unlocked:true},
{id:"impulse_shield",name:"Mobiler Impulsschutz",category:"Schutz",description:"Schützt das Team bei instabilen Energiefeldern und alten Sicherheitsmechanismen.",tags:["energie","defensiv","fallen"],unlocked:false},
{id:"breach_charge",name:"Präzisionsladung",category:"Zugang",description:"Öffnet blockierte Zugänge, kann aber empfindliche Funde beschädigen oder Aufmerksamkeit erzeugen.",tags:["zugang","sprengung","riskant"],unlocked:false},
{id:"env_suit",name:"Atmosphärenanzug",category:"Umweltschutz",description:"Ermöglicht später Expeditionen auf nicht atembaren oder toxischen Welten.",tags:["nicht-atembar","toxisch","später"],unlocked:false},
{id:"gate_stabilizer",name:"Frequenzstabilisator",category:"Gate-Stabilisierung",description:"Ermöglicht später instabile Adressen und schwer erreichbare Welten.",tags:["gate","adresse","später"],unlocked:false}
];

export const FIND_CATEGORIES={relic_fragment:"Reliktfragment",artifact:"Artefakt",technology:"Technologiekomponente",research_data:"Forschungsdaten",bio_sample:"Biologische Probe",cultural:"Kultureller Fund",faction_data:"Fraktionsdaten",hazard:"Gefahrenprotokoll"};

export const FACTIONS={
temple_guard:{name:"Imperiale Tempelkrieger",category:"Militärische Theokratie",known:0,description:"Bewaffnete Wächterkaste mit religiöser Symbolik und territorialem Verhalten."},
star_covenant:{name:"Sternenbund",category:"Fortgeschrittene Beobachter",known:0,description:"Technologisch überlegene Beobachter mit zurückhaltender, möglicherweise diplomatischer Präsenz."},
machine_brood:{name:"Maschinenbrut",category:"Nichtbiologische Bedrohung",known:0,description:"Selbstorganisierende Maschinenmuster. Direkter Kontakt nicht empfohlen."},
energy_mind:{name:"Energiebewusstsein",category:"Nichtkörperliche Lebensform",known:0,description:"Lebenszeichen und Energiesignatur sind nicht sauber trennbar."}
};
