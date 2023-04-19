import renderHeader from '../components/header/header.component';
import renderNav from '../components/nav/nav.component';
import renderMap from "../components/map/map.component";
import renderFooter from '../components/footer/footer.component';
import './index.styles.scss';

const indexPage = () => {
    renderHeader();
    renderNav();
    renderMap('map');
    renderFooter();
};

export default indexPage;
