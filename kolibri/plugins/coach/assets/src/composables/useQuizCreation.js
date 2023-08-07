import { get, set } from '@vueuse/core';
import { ref, onMounted } from 'kolibri.lib.vueCompositionApi';

/**
 * ###
 * # Type documentation & validation
 * ###
 * Some tools for enforcing data structures and providing referencable type definitions for the
 * greater Quiz Creation feature.
 */

/*
 * @typedef  {Object}         Quiz                The overall primary Quiz object
 * @property {string}         title               The title of the whole quiz
 * @property {QuizSection[]}  question_sources    A list of the QuizSection objects that make up the
 *                                                quiz
 *
 * TODO Outline any other fields here that are relevant to our needs
 */

const _quizProps = ['title', 'question_sources'];

/**
 * @param {Object}   possibleQuiz
 * @returns {boolean} True if every property in section is in _quizSectionProps
 */
export function isQuiz(possibleQuiz) {
  return possibleQuiz && Object.keys(possibleQuiz).every(p => _quizProps.includes(p));
}

/*
 * @typedef  {Object}           QuizSection                Defines a single section of the quiz
 * @property {string}           section_id                 A unique ID for the section - this is
 *                                                         only used on the front-end
 * @property {string}           section_title              The title of the quiz section
 * @property {string}           description                A text blob associated with the section
 * @property {number}           question_count             The number of questions in the section
 * @property {QuizQuestion[]}   questions                  The list of QuizQuestion objects in the
 *                                                         section
 * @property {boolean}          learners_see_fixed_order   A bool flag indicating whether this
 *                                                         section is shown in the same order, or
 *                                                         randomized, to the learners
 * @property {ExerciseMap}      exercise_pool              An array of contentnode ids indicat
 */

const _quizSectionProps = [
  'section_id',
  'section_title',
  'description',
  'question_count',
  'questions',
  'learners_see_fixed_order',
  'exercise_pool',
];

/**
 * @param {Object}   section
 * @returns {boolean} True if every property in section is in _quizSectionProps
 */
export function isQuizSection(possibleSection) {
  return possibleSection && Object.keys(possibleSection).every(p => _quizSectionProps.includes(p));
}

/*
 * @typedef  {Object} QuizQuestion         A particular question in a Quiz
 * @property {string} exercise_id          The ID of the resource from which the question originates
 * @property {string} question_id          A *unique* identifier of this particular question within
 *                                         the quiz
 * @property {string} title                A title for the question
 * @property {number} counter_in_exercise  A number assigned to separate questions which have the
 *                                         same title to differentiate them
 */

/*
 * @typedef   {Object}  Exercise        A particular exercise that can be selected within a quiz
 * @property  {string}  ancestor_id     The ID of the parent contentnode
 * @property  {string}  content_id      The ID for the piece of content
 * @property  {string}  id              Unique ID for this exercise
 * @property  {bool}    is_leaf         More or less means "is_not_a_topic"
 * @property  {string}  kind            Exercise or Topic in our case, most likely see
 *                                      kolibri.core.assets.src.constants.ContentNodeKinds
 * @property  {string}  title           The resource title
 */

/*
 * @typedef   {Object}    ExerciseMap     A mapping of an Exercise.id to an Exercise
 * @property  {Exercise}  Exercise.id     The ID for an exercise that will map to an
 *                                        Exercise type object here
 */

// ============ //
// Public State //
// ============ //

/* @type {ref<QuizSection>}
 * The currently selection QuizSection object to be initialized to the first section in the quiz.
 * This is the source-of-truth for what should be visible to the coach as it will reflect changes
 * that have not yet been saved to the rootQuiz object.
 * */
export const activeSection = ref(null);

/* @type {ref<Quiz>}
 * The overall Quiz object */
export const rootQuiz = ref(null);

/** A composable for initializing and interacting with the rootQuiz state
 *
 * @affects {rootQuiz}
 * @affects {activeSection}
 **/
export function useQuiz() {
  const { createSection } = useQuizSection();

  /* @returns {Quiz} */
  function _createQuiz() {
    set(activeSection, createSection());
    return {
      title: '',
      question_sources: [get(activeSection)],
    };
  }

  /* @param {Quiz} updates  The properties of rootQuiz to be updated */
  function updateQuiz(updates) {
    if (!isQuiz(updates)) {
      throw new TypeError(`Invalid Quiz object: ${JSON.stringify(updates)}`);
    }
    set(rootQuiz, { ...get(rootQuiz), ...updates });
  }

  /* @returns {QuizSection}
   * Adds a new QuizSection to rootQuiz, sets it as the activeSection and returns the new section
   * */
  function addSection() {
    const newSection = createSection();
    set(activeSection, newSection);
    updateQuiz({ question_sources: [...getQuizSections(), newSection] });
    return newSection;
  }

  /* @param   {string}  sectionId  The ID of the section to be deleted
   * @returns {QuizSection}        The new active section
   */
  function deleteSection(sectionId) {
    const question_sources = getQuizSections().filter(s => s.section_id !== sectionId);
    updateQuiz({ question_sources });

    if (question_sources.length > 0) {
      const newActiveSection = question_sources[0];
      set(activeSection, newActiveSection);
      return newActiveSection;
    } else {
      // If we delete the last question, make a new one and return it as it will be made active
      // automatically in addSection
      return addSection();
    }
  }

  /* @returns {QuizSection[]} */
  function getQuizSections() {
    return get(rootQuiz).question_sources;
  }

  /* commits change to the active section to the rootQuiz object by updating rootQuiz */
  function saveActiveSection() {
    const activeSectionId = get(activeSection).section_id;
    const question_sources = getQuizSections().map(s => {
      if (s.section_id === activeSectionId) {
        return get(activeSection);
      }
      return s;
    });
    updateQuiz({ question_sources });
  }

  // Initialize the rootQuiz object
  onMounted(() => {
    set(rootQuiz, _createQuiz());
  });

  return { addSection, deleteSection, saveActiveSection, updateQuiz, getQuizSections, _createQuiz };
}

/* A composable providing methods for updating and reading the activeSection - that is - the
 * section currently being edited by the user.
 *
 * This gives us the ability to make changes to the activeSection without committing them to the
 * rootQuiz object until the user is ready to save their changes.
 *
 * Note that this should not WRITE the rootQuiz object -- utilities for such behavior belong in
 * useQuiz()
 *
 * @affects {activeSection}
 */
export function useActiveSection() {
  /*
   * @param {QuizSection} updates  The properties of activeSection to be updated
   * @throws {TypeError} when the given value does not match shape of QuizSection as defined above
   */
  function updateActiveSection(updates) {
    if (!isQuizSection(updates)) {
      throw new TypeError(`Invalid QuizSection object: ${JSON.stringify(updates)}`);
    }
    set(activeSection, { ...get(activeSection), ...updates });
  }

  /* Returns the value of activeSection to its last saved value within rootQuiz, clearing changes
   * that have been made in the process */
  function revertActiveSectionChanges() {
    const originalSectionState = get(rootQuiz).question_sources.find(
      s => s.section_id === get(activeSection).section_id
    );

    if (!originalSectionState) {
      throw new Error(
        `Could not find original section state for section ${get(activeSection).section_id}`
      );
    }

    set(activeSection, originalSectionState);
  }

  return { revertActiveSectionChanges, updateActiveSection };
}

export function useQuizSection() {
  /* @returns {QuizSection} */
  function createSection() {
    return {
      // FIXME Need to properly generate this
      section_id: `${Math.floor(Math.random() * 1000000000)}`,
      section_title: '',
      description: '',
      question_count: 0,
      questions: [],
      learners_see_fixed_order: false,
      exercise_pool: {},
    };
  }

  return { createSection };
}
