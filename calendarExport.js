// Add custom stylesheet
const stylesheet = document.createElement("style");
stylesheet.innerHTML = `
/* Export button */
#bettervisma-export
{
    height: 34px;
    padding: 7.5px;
    background: transparent;
    border: 0.071em solid #ccc;
    border-radius: 0.286em;
    font-weight: 600;
    transform: translate(1rem, .4rem);
    transition: 100ms ease;
}

#bettervisma-export:hover
{
    background: #edeeef;
}

#bettervisma-export:active
{
    background: #dcddde;
}

/* Help button */
#bettervisma-help
{
    cursor: pointer;
    user-select: none;
    transform: translate(20px, 5px);
}

/* Help dialog */
#bettervisma-help-dialog
{
    max-width: 40rem;
    padding: 0 2rem 2rem;
    border: none;
    border-radius: 1rem;
    line-height: 1.6rem;
    box-shadow: 0 0 2rem rgba(0, 0, 0, .3);
}

/* Current day */
.active.Timetable-TimetableDays_day
{
    background: rgba(0, 0, 0, .07);
}

/* Current time line */
.Timetable-TimetableNowLine
{
    height: 2px !important;
    z-index: 1;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, .6));
}
`;

stylesheet.id ="bettervisma-style";
document.head.appendChild(stylesheet);

// Add google fonts
const googleFontsLink = document.createElement("link");
googleFontsLink.setAttribute("href", "https://fonts.googleapis.com/icon?family=Material+Icons");
googleFontsLink.setAttribute("rel", "stylesheet");
googleFontsLink.id = "bettervisma-font-link"
document.head.appendChild(googleFontsLink);

// Create export button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Eksporter til kalender";
exportButton.id = "bettervisma-export"
exportButton.addEventListener("click", () => exportCalendar());

// Create help button
const helpButton = document.createElement("span");
helpButton.id = "bettervisma-help";
helpButton.innerHTML = "help_outline";
helpButton.classList.add("material-icons");
helpButton.addEventListener("click", () => helpDialog.showModal());

// Create help dialog
const helpDialog = document.createElement("dialog");
helpDialog.id = "bettervisma-help-dialog";
helpDialog.innerHTML = `
    <h1>Hvordan eksportere til kalender</h1>
    <p>Trykk på <button id="bettervisma-export" style="transform: unset">Eksporter
        til kalender</button>. Dette vil laste ned en <code>.ics</code> fil for uken du har åpen. Du kan legge denne
        filen inn direkte i din personlige kalender, eller importere den i f.eks. Google kalender.</p>
    <p><i><b>NB!</b> Eksportert timeplan blir ikke automatisk oppdatert, og blir heller ikke slettet hvis du
        importerer på nytt. Pass på å slette eksisterende kalender hvis du vil importere på nytt.</i></p>
    <button onclick="this.parentElement.close()">Lukk</button>
`;
helpDialog.querySelector("#bettervisma-export").addEventListener("click", () => exportCalendar());

// Add help dialog to document
document.body.appendChild(helpDialog);

// Add elements on mutation
let observer = new MutationObserver(() =>
{
    const node = document.querySelector(".userTimetable_timetableFilters_left.userTimetable_timetableFilters_left_xl");

    if (node)
    {
        // Inject elements
        node.appendChild(exportButton);
        node.appendChild(helpButton);

        // Restart observer for page redirects
        observer.disconnect();
        setTimeout(() => observer.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false }), 100);
    }
})

// Start observer
observer.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });

// Greet user after a timeout to avoid warning spam
setTimeout(() =>
{
    console.clear();

    console.log("%c[BetterVisma] Using BetterVisma", `
        font-size: 1.6rem;
    `);
    console.info("Version 2.0");
    console.info("%chttps://yessness.com/bettervisma", `
        color: #007aca;
    `);
}, 2000);

// Function for exporting the calendar
function exportCalendar()
{
    // Log progress
    console.info("[BetterVisma] [INFO] Attempting export...");

    // Create calendar object
    const calendar = ics();

    // Store dates for current week
    const dates = (() =>
    {
        // Create result object
        const result = [];

        // Initialise day to the first day of the week
        let day = (() =>
        {
            // Get and format current date from UI
            const inputDate = document.querySelector(".vsware-input.form-control.vs-Flatpickr.flatpickr-input").value.split(".");
            const formattedDate = `${inputDate[1]}/${inputDate[0]}/${inputDate[2]}`;

            // Get offset to first day of week
            const date = new Date(Date.parse(formattedDate));
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);

            // Calculate first day of week
            const firstDay = new Date(date.setDate(diff));
            console.debug("[BetterVisma] [DEBUG] Determined week start: " + firstDay);
            return firstDay;
        })();

        // Add dates to result
        for (let i = 0; i < 5; i++)
        {
            result.push(day.toString());
            day.setDate(day.getDate() + 1);
        }

        console.debug("[BetterVisma] [DEBUG] Received dates: " + result);
        return result;
    })();

    // Get items in timetable
    let day = -1;
    let lastOffset = 0;
    console.debug("[BetterVisma] [DEBUG] Saving data from timetable...");
    document.querySelectorAll(".Timetable-TimetableItem").forEach(e =>
    {
        // Get data from timetable item
        const startTime = e.querySelector(".Timetable-TimetableItem-hours").innerHTML.substring(48, 53);
        const endTime = e.querySelector(".Timetable-TimetableItem-hours").innerHTML.substring(56, 61);
        const subject = e.querySelector(".Timetable-TimetableItem-subject-name").innerHTML.trim();
        const location = e.querySelector(".Timetable-TimetableItem-location").innerHTML.substring(53).trim();

        // Parse time
        const startHours = parseInt(startTime.substring(0, 2));
        const startMinutes = parseInt(startTime.substring(3, 5));

        const endHours = parseInt(endTime.substring(0, 2));
        const endMinutes = parseInt(endTime.substring(3, 5));

        // Increment day when needed
        const currentOffset = e.getBoundingClientRect().left;
        if (currentOffset > lastOffset) day++;
        lastOffset = currentOffset;

        // Create Date objects for start and end
        const startDate = new Date(Date.parse(dates[day]));
        const endDate = new Date(Date.parse(dates[day]));

        startDate.setHours(startHours, startMinutes);
        endDate.setHours(endHours, endMinutes);

        // Add events to calendar
        calendar.addEvent(subject, "", `Rom ${location}`, startDate, endDate);
    });

    // Download the calendar file in .ics format
    calendar.download('visma-export', '.ics');
    console.info("[BetterVisma] [INFO] Export successful, file downloaded");
}
