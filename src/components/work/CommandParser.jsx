import {
    getWelcomeView,
    getHelpView,
    getMenuView,
    getAboutView,
    getProjectsView,
    getExperienceView,
    getSkillsView,
    getContactView,
} from './TerminalViews';

// Command parser utility
export const parseCommand = (input, currentView, navigationHistory) => {
    const command = input.trim().toLowerCase();

    // Command registry
    const commands = {
        help: () => ({
            output: getHelpView(),
            view: 'help',
        }),
        menu: () => ({
            output: getMenuView(),
            view: 'menu',
        }),
        about: () => ({
            output: getAboutView(),
            view: 'about',
        }),
        projects: () => ({
            output: getProjectsView(),
            view: 'projects',
        }),
        experience: () => ({
            output: getExperienceView(),
            view: 'experience',
        }),
        skills: () => ({
            output: getSkillsView(),
            view: 'skills',
        }),
        contact: () => ({
            output: getContactView(),
            view: 'contact',
        }),
        clear: () => ({
            output: '',
            view: 'clear',
            clearScreen: true,
        }),
        start: () => ({
            output: 'Returning to mode selection...\n',
            view: 'start',
            resetMode: true,
        }),
        close: () => ({
            output: 'Switching to FUN mode...\n',
            view: 'close',
            switchToFun: true,
        }),
        minimize: () => ({
            output: 'Switching to NORMAL mode...\n',
            view: 'minimize',
            switchToNormal: true,
        }),
        maximize: () => ({
            output: 'Toggling fullscreen...\n',
            view: 'maximize',
            toggleFullscreen: true,
        }),
        fun: () => ({
            output: 'Switching to FUN mode...\n',
            view: 'fun',
            switchToFun: true,
        }),
        normal: () => ({
            output: 'Switching to NORMAL mode...\n',
            view: 'normal',
            switchToNormal: true,
        }),
        back: () => {
            if (navigationHistory.length > 0) {
                const previousView = navigationHistory[navigationHistory.length - 1];
                const viewMap = {
                    welcome: getWelcomeView,
                    help: getHelpView,
                    menu: getMenuView,
                    about: getAboutView,
                    projects: getProjectsView,
                    experience: getExperienceView,
                    skills: getSkillsView,
                    contact: getContactView,
                };
                return {
                    output: viewMap[previousView] ? viewMap[previousView]() : getMenuView(),
                    view: previousView,
                    isBack: true,
                };
            }
            return {
                output: "Already at the start. Type 'menu' to see options.\n",
                view: currentView,
            };
        },
    };

    // Check for numbered commands (1-5)
    const numberMap = {
        '1': 'about',
        '2': 'projects',
        '3': 'experience',
        '4': 'skills',
        '5': 'contact',
    };

    if (numberMap[command]) {
        return commands[numberMap[command]]();
    }

    // Execute command if it exists
    if (commands[command]) {
        return commands[command]();
    }

    // Command not found
    return {
        output: `Command not found: '${input}'\nType 'help' for available commands.\n`,
        view: currentView,
        error: true,
    };
};
