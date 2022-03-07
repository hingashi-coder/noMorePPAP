import type {NextPage} from 'next'
import Head from 'next/head'
import Image from 'next/image'
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import {Button, Card, CardActions, CardContent, Link, Typography} from "@mui/material";
import {Box} from "@mui/system";
import SvgIcon from '@mui/material/SvgIcon';

const LinkItem = (props: {
  href: string,
  title: string,
  jp: string,
  en: string,
  icon: typeof SvgIcon
}) => {
  return (
    <Card sx={{ minWidth: 275 }} variant="outlined">
      <CardContent>
        <Typography sx={{ fontSize: 20 }} gutterBottom>
          {props.title} <props.icon/>
        </Typography>
        <Typography variant="h5" component="div">
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          {props.en}
        </Typography>
        <Typography variant="body2">
          {props.jp}
        </Typography>
      </CardContent>
      <CardActions>
        <Link href={props.href}>
          <Button variant="contained">開く</Button>
        </Link>
      </CardActions>
    </Card>
  )
}
const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <meta name="description" content="パスワード不要・RSA暗号とAES暗号を併用したファイル暗号化ツール"/>
      </Head>

      <main>
        <Box
          sx={{
            height: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <h1>
            No More <span style={{color: "blue"}}>PPAP!</span>
          </h1>
          <p>
            メールで添付ファイルのパスワード送っていませんか？
          </p>
        </Box>


        <Box sx={{
          display: "flex",
          maxWidth: 1000,
          justifyContent: "space-evenly",
          margin: "0 auto"
        }}>
          <LinkItem en="Encrypt File" jp="ファイルを暗号化する" href={"/encrypt"} title={"暗号化"} icon={LockIcon}/>
          <LinkItem en="Decrypt File" jp="ファイルを複号化する" href={"/decrypt"} title={"複号化"} icon={LockOpenIcon}/>
          <LinkItem en="Start Here!" jp="初めての方はこちら" href={"/keygen"} title={"暗号化キー生成"} icon={RocketLaunchIcon}/>
        </Box>
      </main>

    </div>
  )
}

export default Home
