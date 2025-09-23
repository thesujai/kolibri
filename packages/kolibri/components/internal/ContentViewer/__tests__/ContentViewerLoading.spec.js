import { render, screen } from '@testing-library/vue';
import ContentViewerLoading from '../ContentViewerLoading.vue';

describe('ContentViewerLoading', () => {
  test('the component should render correctly', () => {
    render(ContentViewerLoading);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
