import { get, set } from '@vueuse/core';
import { ref, onMounted } from 'kolibri.lib.vueCompositionApi';

/**
 * # Type Definitions
 * These are for reference and should be updated as the model for a quiz or its parts changes
 */

/*
 * @typedef  {Object}         Quiz                The overall primary Quiz object
 * @property {string}         title               The title of the whole quiz
 * @property {QuizSection[]}  question_sources    A list of the QuizSection objects that make up the
 *                                                quiz
 * TODO Outline any other fields here that are relevant to our needs
 */

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
 * The currently selection QuizSection object to be initialized to the first section in the quiz */
export const activeSection = ref(null);
/* @type {ref<Quiz>}
 * The overall Quiz object */
export const rootQuiz = ref(null);

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
    set(rootQuiz, { ...rootQuiz, ...updates });
  }

  // Initialize the rootQuiz object
  onMounted(() => {
    set(rootQuiz, _createQuiz());
  });

  return { updateQuiz };
}

export function useQuizSection() {
  /* @returns {QuizSection} */
  function createSection() {
    return {
      section_id: '',
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
