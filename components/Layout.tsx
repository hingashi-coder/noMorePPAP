import {NextPage} from "next";
import Appbar from './appbar'
type Props = {
    children?: React.ReactNode;
    home?: boolean;
};


export const Layout:NextPage<Props> = ({children}) => {
    return (
        <>
            <Appbar></Appbar>
            {children}
        </>
    )
}
