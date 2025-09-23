import KolibriModule from 'kolibri-module';

export default class ContentViewer extends KolibriModule {
  get viewerComponent() {
    return null;
  }
  loadDirectionalCSS(direction) {
    return this.Kolibri.loadDirectionalCSS(this, direction);
  }
}
