import createEle from '../../../utils/createEle.util';
import './header.style.scss';
import renderNav from './nav/nav.component';

const renderHeader = () => {
    createEle('header',`
    <h1>Garrett County Adventures</h1>
    `,document.body)
    renderNav()
}

export default renderHeader;