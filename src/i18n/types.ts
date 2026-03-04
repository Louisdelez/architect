export type Locale = 'fr' | 'en' | 'de' | 'it' | 'es';

export interface TranslationKeys {
  // ─── Common ─────────────────────────────────────────
  'common.cancel': string;
  'common.save': string;
  'common.delete': string;
  'common.confirm': string;
  'common.add': string;
  'common.or': string;
  'common.search': string;
  'common.download': string;
  'common.title': string;
  'common.description': string;
  'common.content': string;
  'common.modified': string;
  'common.lastModified': string;
  'common.copyContent': string;
  'common.confirmDelete': string;
  'common.confirmDeleteMessage': string;
  'common.newTag': string;

  // ─── Auth ───────────────────────────────────────────
  'auth.loginSubtitle': string;
  'auth.registerSubtitle': string;
  'auth.namePlaceholder': string;
  'auth.emailPlaceholder': string;
  'auth.passwordPlaceholder': string;
  'auth.loginButton': string;
  'auth.registerButton': string;
  'auth.continueWithGoogle': string;
  'auth.noAccount': string;
  'auth.hasAccount': string;
  'auth.errorEmailInUse': string;
  'auth.errorInvalidEmail': string;
  'auth.errorWeakPassword': string;
  'auth.errorWrongCredentials': string;
  'auth.errorTooManyRequests': string;
  'auth.errorNetwork': string;
  'auth.errorGeneric': string;

  // ─── Sidebar ────────────────────────────────────────
  'sidebar.projects': string;
  'sidebar.changeTheme': string;
  'sidebar.newProject': string;
  'sidebar.searchPlaceholder': string;
  'sidebar.noProjects': string;
  'sidebar.noResults': string;
  'sidebar.downloadProject': string;
  'sidebar.deleteProject': string;
  'sidebar.themeLigth': string;
  'sidebar.themeDark': string;
  'sidebar.themeSystem': string;

  // ─── User Menu ──────────────────────────────────────
  'userMenu.defaultName': string;
  'userMenu.logout': string;

  // ─── Empty State ────────────────────────────────────
  'emptyState.selectProject': string;
  'emptyState.noProjects': string;
  'emptyState.selectProjectHint': string;
  'emptyState.noProjectsHint': string;
  'emptyState.openProjects': string;
  'emptyState.createProject': string;

  // ─── Create Project Modal ──────────────────────────
  'createProject.title': string;
  'createProject.subtitle': string;
  'createProject.namePlaceholder': string;
  'createProject.createButton': string;

  // ─── Documents ──────────────────────────────────────
  'documents.title': string;
  'documents.selectDocument': string;
  'documents.openList': string;

  // ─── Editor ─────────────────────────────────────────
  'editor.lineCount': string;
  'editor.emptyDocument': string;
  'editor.copyToClipboard': string;
  'editor.download': string;
  'editor.preview': string;
  'editor.print': string;
  'editor.links': string;
  'editor.addLink': string;

  // ─── Preview ────────────────────────────────────────
  'preview.emptyDocument': string;

  // ─── Tabs ───────────────────────────────────────────
  'tabs.documents': string;
  'tabs.journal': string;
  'tabs.prompts': string;
  'tabs.kanban': string;
  'tabs.calendar': string;

  // ─── Journal ────────────────────────────────────────
  'journal.title': string;
  'journal.entryCount': string;
  'journal.downloadAll': string;
  'journal.newEntry': string;
  'journal.titlePlaceholder': string;
  'journal.contentPlaceholder': string;
  'journal.noEntries': string;
  'journal.noEntriesHint': string;
  'journal.emptyEntry': string;
  'journal.contentLabel': string;
  'journal.downloadEntry': string;

  // ─── Prompts ────────────────────────────────────────
  'prompts.title': string;
  'prompts.promptCount': string;
  'prompts.newPrompt': string;
  'prompts.titlePlaceholder': string;
  'prompts.contentPlaceholder': string;
  'prompts.noPrompts': string;
  'prompts.noPromptsHint': string;

  // ─── Kanban ─────────────────────────────────────────
  'kanban.title': string;
  'kanban.cardCount': string;
  'kanban.columnTodo': string;
  'kanban.columnInProgress': string;
  'kanban.columnDone': string;
  'kanban.priorityHigh': string;
  'kanban.priorityMedium': string;
  'kanban.priorityLow': string;
  'kanban.cardTitlePlaceholder': string;
  'kanban.descriptionPlaceholder': string;
  'kanban.priority': string;
  'kanban.dueDate': string;
  'kanban.tags': string;

  // ─── Calendar ───────────────────────────────────────
  'calendar.title': string;
  'calendar.today': string;
  'calendar.event': string;
  'calendar.viewYear': string;
  'calendar.viewMonth': string;
  'calendar.viewWeek': string;
  'calendar.viewDay': string;
  'calendar.viewYearShort': string;
  'calendar.viewMonthShort': string;
  'calendar.viewWeekShort': string;
  'calendar.viewDayShort': string;
  'calendar.newEvent': string;
  'calendar.editEvent': string;
  'calendar.editOccurrence': string;
  'calendar.eventTitleLabel': string;
  'calendar.eventTitlePlaceholder': string;
  'calendar.eventDescriptionLabel': string;
  'calendar.eventDescriptionPlaceholder': string;
  'calendar.dateLabel': string;
  'calendar.startLabel': string;
  'calendar.endLabel': string;
  'calendar.colorLabel': string;
  'calendar.deleteOccurrence': string;
  'calendar.create': string;
  'calendar.recurrenceActionTitle': string;
  'calendar.recurrenceActionHint': string;
  'calendar.thisEventOnly': string;
  'calendar.allEvents': string;
  'calendar.recurrenceLabel': string;
  'calendar.recurrenceNone': string;
  'calendar.recurrenceDaily': string;
  'calendar.recurrenceWeekly': string;
  'calendar.recurrenceMonthly': string;
  'calendar.recurrenceYearly': string;
  'calendar.recurrenceCustom': string;
  'calendar.every': string;
  'calendar.freqDays': string;
  'calendar.freqWeeks': string;
  'calendar.freqMonths': string;
  'calendar.freqYears': string;
  'calendar.weekdays': string;
  'calendar.dayOfMonth': string;
  'calendar.nthWeekday': string;
  'calendar.endCondition': string;
  'calendar.endNever': string;
  'calendar.endAfter': string;
  'calendar.endOccurrences': string;
  'calendar.endUntil': string;
  'calendar.recurrenceEdit': string;
  'calendar.recurrenceDelete': string;
  'calendar.recurrenceMove': string;
  'calendar.weekdayLabels': string;
  'calendar.weekdayNames': string;
  'calendar.monthDayLabelsShort': string;
  'calendar.monthDayLabelsFull': string;
  'calendar.nthFirst': string;
  'calendar.nthLast': string;
  'calendar.nthOther': string;

  // ─── Export ─────────────────────────────────────────
  'export.updatedOn': string;
  'export.journalFilename': string;
  'export.untitled': string;

  // ─── Language selector ──────────────────────────────
  'language.label': string;
  'language.fr': string;
  'language.en': string;
  'language.de': string;
  'language.it': string;
  'language.es': string;
}
