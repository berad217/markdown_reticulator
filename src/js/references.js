// =================================================================
// THE HALL OF RIDICULOUS REFERENCES
// Easy to edit, add, or remove. Future legendary rarity system goes here.
// =================================================================

const RIDICULOUS_REFERENCES = {
    titles: [
        "The Markdown Whisperer",
        "Markdown: Impossible",
        "The Fast and the Markdown",
        "Markdown Liberation Front",
        "The Chosen One's Markdown Converter",
        "Markdown: Endgame"
    ],

    subtitles: [
        "Because explaining asterisks to your spouse is harder than quantum physics",
        "Making markdown less mysterious than the ending of Lost",
        "Converting text faster than you can say 'Supercalifragilisticexpialidocious'",
        "It's dangerous to go alone! Take this converter.",
        "The converter that will make you feel like you have the high ground",
        "Converting with the power of Grayskull"
    ],

    dropZoneHeadings: [
        "Drop your markdown files here and all your dreams will come true",
        "Drop it like it's .md",
        "Nobody puts markdown in a corner",
        "I'll be back... with your converted files",
        "Choose your fighter: Drag or Browse",
        "This is where the magic happens, Wayne",
        "Release the kraken! (or just drop your files)",
        "Say hello to my little friend... the file browser"
    ],

    dropZoneSubtext: [
        "Or click to browse for .md files (like a civilized person)",
        "Supports all standard markdown syntax (and bad jokes)",
        "Warning: May cause uncontrollable productivity",
        "Side effects may include: clarity, readability, and mild euphoria",
        "Now with 37% more awesome than our competitors",
        "Powered by caffeine and questionable life choices"
    ],

    successMessages: [
        "Great success! Very nice!",
        "Mission accomplished, Agent",
        "Winner winner, chicken dinner!",
        "You have chosen... wisely",
        "That's what I'm talking about!",
        "Boom goes the dynamite!",
        "Converting power level: OVER 9000!",
        "File converted successfully. Resistance is futile."
    ],

    errorMessages: [
        "All your base are belong to us... but this file doesn't",
        "Computer says no",
        "This is not the file you're looking for",
        "Error 404: File not markdown enough",
        "I'm sorry Dave, I can't do that",
        "Game over, man! Game over!",
        "Does not compute, Johnny 5"
    ],

    emptyStates: [
        "No file yet? That's unpossible!",
        "The files... they do nothing!",
        "Waiting for input like a Windows 95 startup screen",
        "Hello, is it files you're looking for?",
        "Reticulating splines... (just kidding, drop a file)",
        "Please wait while we enhance your calm... with markdown"
    ],

    buttonLabels: {
        copy: ["Beam me up, Scotty", "Copy this, young Padawan", "Ctrl+C like it's 1999"],
        save: ["Save Ferris", "I'll take 'Files to Download' for 200, Alex", "Make it so, Number One"],
        clear: ["Hasta la vista, baby", "This message will self destruct (if you press)", "Begone, foul document!"]
    }
};

function getRandomReference(category, subcategory = null) {
    const references = subcategory
        ? RIDICULOUS_REFERENCES[category][subcategory]
        : RIDICULOUS_REFERENCES[category];
    return references[Math.floor(Math.random() * references.length)];
}
