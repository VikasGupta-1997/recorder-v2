import {
    Menu,
    MenuItem,
    MenuButton,
    type MenuDirection
} from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';

const CustomMenu = ({ menuButton, menuList, onMenuClick, direction = "bottom" }: { menuButton: any, menuList: any[], onMenuClick: Function, direction?: MenuDirection }) => {
    return (
        <Menu
            overflow='auto'
            menuButton={
                <MenuButton>
                    {menuButton}
                </MenuButton>
            }
            direction={direction}
        >
            {
                menuList.map((menu, i) => (
                    <MenuItem key={i} onClick={() => onMenuClick(menu)}>
                        <span className='flex gap-2 items-center' >{menu?.icon ?? menu?.icon} {menu.label}</span>
                    </MenuItem>
                ))
            }
        </Menu>
    )
}

export default CustomMenu