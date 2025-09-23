<template>

  <CoreSnackbar
    v-if="snackbarIsVisible"
    :key="key"
    v-autofocus="snackbarOptions.autofocus"
    v-blur="snackbarOptions.onBlur"
    :text="snackbarOptions.text"
    :actionText="snackbarOptions.actionText"
    :backdrop="snackbarOptions.backdrop"
    :autoDismiss="snackbarOptions.autoDismiss"
    :duration="snackbarOptions.duration"
    :bottomPosition="snackbarOptions.bottomPosition"
    @actionClicked="snackbarOptions.actionCallback()"
    @hide="hideCallback"
  />

</template>


<script>

  import useSnackbar from 'kolibri/composables/useSnackbar';
  import { nextTick } from 'vue';
  import CoreSnackbar from './internal/CoreSnackbar';

  export default {
    name: 'GlobalSnackbar',
    components: {
      CoreSnackbar,
    },
    directives: {
      /**
       * Using directives here to have a cleaner control over DOM elements and the
       * snackbar button element, if rendered.
       *
       * TODO: This could be managed directly with vue event handlers and KDS
       * properties, but `CoreSnackbar` uses a keen component, and the snackbar
       * handling should probably be refactored before extending more functionalities.
       */
      autofocus: {
        async inserted(el, binding) {
          if (binding.value === false) {
            return;
          }
          const snackbarButton = el.querySelector('button');
          if (snackbarButton) {
            await nextTick();
            snackbarButton.focus();
          }
        },
      },
      blur: {
        bind(el, binding) {
          if (!binding.value) {
            return;
          }
          // Save blur methods on element, so we can remove them later
          el._onBlurHandler = binding.value;
          el._onKeydownHandler = event => {
            if (event.key === 'Tab') {
              event.preventDefault();
              el._onBlurHandler(event);
            }
          };

          const snackbarButton = el.querySelector('button');
          if (snackbarButton) {
            snackbarButton.addEventListener('blur', el._onBlurHandler);
            snackbarButton.addEventListener('keydown', el._onKeydownHandler);
          }
        },
        unbind(el) {
          const snackbarButton = el.querySelector('button');
          if (snackbarButton) {
            snackbarButton.removeEventListener('blur', el._onBlurHandler);
            snackbarButton.removeEventListener('keydown', el._onKeydownHandler);
          }

          delete el._onBlurHandler;
          delete el._onKeydownHandler;
        },
      },
    },
    setup() {
      const { snackbarIsVisible, snackbarOptions, clearSnackbar } = useSnackbar();

      return {
        snackbarIsVisible,
        snackbarOptions,
        clearSnackbar,
      };
    },
    computed: {
      key() {
        const options = Object.assign({}, this.snackbarOptions);
        // The forceReuse option is used to force the reuse of the snackbar
        // This is helpful when we want to just update the text but not re-run the transition
        // This is used in the disconnected snackbar
        if (options.forceReuse) {
          options.text = '';
          return JSON.stringify(options);
        }
        return JSON.stringify(options) + new Date();
      },
    },
    destroyed() {
      this.clearSnackbar();
    },
    methods: {
      hideCallback() {
        if (this.snackbarOptions.hideCallback) {
          this.snackbarOptions.hideCallback();
        }
        this.clearSnackbar();
      },
    },
  };

</script>


<style lang="scss" scoped></style>
