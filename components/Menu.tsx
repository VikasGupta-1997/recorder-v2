import {
    Menu,
    MenuItem,
    MenuButton
} from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';

const CustomMenu = ({ menuButton, menuList, onMenuClick }) => {
    return (
        <Menu
            menuButton={
                <MenuButton>
                    {menuButton}
                </MenuButton>
            }
            direction="left"
        >
            {
                menuList.map((menu, i) => (
                    <MenuItem key={i} onClick={() => onMenuClick(menu)}>
                       <span className='flex gap-2 items-center' >{menu?.icon ?? menu?.icon } {menu.label}</span>
                    </MenuItem>
                ))
            }
        </Menu>
    )
}

export default CustomMenu