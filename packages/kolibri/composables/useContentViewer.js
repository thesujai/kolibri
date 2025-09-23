import Vue, { ref, computed, getCurrentInstance } from 'vue';
import { get } from '@vueuse/core';
import logger from 'kolibri-logging';
import { ContentErrorConstants } from 'kolibri/constants';
import {
  defaultLanguage,
  languageValidator,
  getContentLangDir,
  languageDirections,
} from 'kolibri/utils/i18n';
import { getRenderableFiles, getDefaultFile } from '../components/internal/ContentViewer/utils';
import ContentViewerError from '../components/internal/ContentViewer/ContentViewerError';

const logging = logger.getLogger(__filename);

const ContentViewerErrorComponent = Vue.extend(ContentViewerError);

const fileFieldMap = {
  storage_url: {
    type: String,
  },
  id: {
    type: String,
  },
  priority: {
    type: Number,
  },
  available: {
    type: Boolean,
  },
  file_size: {
    type: Number,
  },
  checksum: {
    type: String,
  },
  extension: {
    type: String,
  },
  preset: {
    type: String,
  },
  lang: {
    type: Object,
    validator: lang => lang === null || languageValidator(lang),
  },
  supplementary: {
    type: Boolean,
  },
  thumbnail: {
    type: Boolean,
  },
};

function fileValidator(file) {
  let result = true;
  for (const key in fileFieldMap) {
    const val =
      typeof file[key] !== 'undefined' &&
      typeof file[key] === typeof fileFieldMap[key].type() &&
      (fileFieldMap[key].validator ? fileFieldMap[key].validator(file[key]) : true);
    if (!val) {
      logging.error(`Validation failed for '${key}' in `, file);
      result = false;
    }
  }
  return result;
}

function multipleFileValidator(files) {
  return files.reduce((acc, file) => acc && fileValidator(file), true);
}

export const contentViewerProps = {
  files: {
    type: Array,
    default: () => [],
    validator: multipleFileValidator,
  },
  // As an alternative to passing a file object to set the state of the
  // content viewer, can also pass raw itemData (which will be parsed by
  // the viewer if there are no files or file object).
  // The type could depend on the viewer, so we enforce nothing here
  // except a null default.
  itemData: {
    default: null,
  },
  // If just itemData is passed, we have no mechanism for knowing the preset
  // of the data, and hence which viewer to choose. If itemData is utilized
  // the preset must be explicitly set.
  preset: {
    default: null,
    type: String,
  },
  itemId: {
    type: String,
  },
  answerState: {
    type: Object,
    default: () => ({}),
  },
  allowHints: {
    type: Boolean,
    default: true,
  },
  extraFields: {
    type: Object,
    default: () => ({}),
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  // Allow content viewers to display in a static mode
  // where user interaction is not allowed
  interactive: {
    type: Boolean,
    default: true,
  },
  lang: {
    type: Object,
    default: () => defaultLanguage,
    validator: languageValidator,
  },
  showCorrectAnswer: {
    type: Boolean,
    default: false,
  },
  timeSpent: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: null,
  },
  userId: {
    type: String,
    default: '',
  },
  userFullName: {
    type: String,
    default: '',
  },
  progress: {
    type: Number,
    default: 0,
  },
};

export default function useContentViewer(props, { emit }, { defaultDuration = null } = {}) {
  const instance = getCurrentInstance();
  const _resourceError = ref(null);

  // Computed properties
  const forceDurationBasedProgress = computed(() => {
    return props.options.force_duration_based_progress || false;
  });

  const durationBasedProgress = computed(() => {
    const duration = props.duration || get(defaultDuration);
    if (!duration) {
      return null;
    }
    return props.timeSpent / duration;
  });

  const defaultFile = computed(() => {
    return getDefaultFile(getRenderableFiles(props.files));
  });

  const supplementaryFiles = computed(() => {
    return props.files.filter(file => file.supplementary && file.available);
  });

  const thumbnailFiles = computed(() => {
    return props.files.filter(file => file.thumbnail && file.available);
  });

  const contentDirection = computed(() => {
    return getContentLangDir(props.lang);
  });

  const contentIsRtl = computed(() => {
    return contentDirection.value === languageDirections.RTL;
  });

  const availableHints = computed(() => {
    return 0;
  });

  const totalHints = computed(() => {
    return 0;
  });

  // Methods
  const checkAnswer = () => {
    logging.warn('This content viewer has not implemented the checkAnswer method');
    return null;
  };

  const takeHint = () => {
    logging.warn('This content viewer has not implemented the takeHint method');
    return null;
  };

  let _errorComponent;

  const reportError = error => {
    emit('error', error);
    _resourceError.value = error;
    if (!_errorComponent) {
      const domNode = document.createElement('div');
      instance.$el.prepend(domNode);
      _errorComponent = new ContentViewerErrorComponent({
        el: domNode,
        parent: instance,
        propsData: { error: _resourceError, files: props.files },
      });
    }
  };

  const reportLoadingError = error => {
    reportError({
      message: error,
      error: ContentErrorConstants.LOADING_ERROR,
    });
  };

  return {
    _resourceError,
    forceDurationBasedProgress,
    durationBasedProgress,
    defaultFile,
    supplementaryFiles,
    thumbnailFiles,
    contentDirection,
    contentIsRtl,
    availableHints,
    totalHints,
    checkAnswer,
    takeHint,
    reportLoadingError,
    reportError,
  };
}
