import renderHeader from '../components/header/header.component';
import renderMap from "../components/map/map.component";
import renderFooter from '../components/footer/footer.component';
import './index.styles.scss';

const indexPage = () => {
    renderHeader();
    renderMap('map');
    renderFooter();
};

export default indexPage;
