import { createLocalVue, shallowMount } from '@vue/test-utils';
import { get } from '@vueuse/core';
import {
  rootQuiz,
  activeSection,
  useQuiz,
  useQuizSection,
} from '../src/composables/useQuizCreation.js';

const TestComponent = {
  setup() {
    return { rootQuiz, activeSection, ...useQuiz(), ...useQuizSection() };
  },
  template: '<span>&nbsp;</span>',
};

const localVue = createLocalVue();
localVue.component({ TestComponent });

function makeWrapper() {
  return shallowMount(TestComponent);
}

describe('Initialization', () => {
  it('Creates the initial rootQuiz object and its initial section is the selected one', () => {
    const wrapper = makeWrapper();
    expect(get(wrapper.vm.rootQuiz)).toBeTruthy();
    expect(get(wrapper.vm.activeSection)).toBeTruthy();
  });
});

describe('use');
