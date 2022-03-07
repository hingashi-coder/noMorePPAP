import {
  Alert,
  Button,
  Container,
  Divider, Fade,
  Paper, Snackbar, Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from "@mui/material";
import {NextPage} from "next";
import Box from "@mui/material/Box";
import {useEffect, useState} from "react";
import { LoadingButton } from '@mui/lab';
import {string} from "prop-types";

interface Props {
  status: number,
  setStatus: (enable: number) => void
}


const Step1 = (props: Props) => {
  const [confirm, setConfirm] = useState(true)
  return (
    <Fade in={props.status == 0} style={{transitionDelay: `400ms`}} unmountOnExit>
      <Paper sx={{my: 5, p: 2}} elevation={12}>
        <p>注意事項</p>
        <Box
          component="form"
          noValidate
          autoComplete="off"
        >
          <Alert severity="warning" sx={{my: 2}}>
            復号化に必要なキーは絶対に公開しないでください。
            ファイルを送信する人が暗号化キーを生成するのではなく、ファイルを受信する人が暗号化キーを生成する必要があります。
          </Alert>
          <p>上記の内容を確認した後、下記フォームに[yes]と入力してください。</p>
          <TextField id="pass" label="確認" variant="outlined" sx={{width: "100%", my: 2}}
                     onChange={(event) => {
                       setConfirm(event.target.value !== "yes")
                     }}
                     onKeyPress={(e) => {
                       e.key === 'Enter' && e.preventDefault();
                     }}
          />
          <div style={{
            textAlign: "right"
          }}>
            <Button
              variant="contained"
              onClick={() => {
                props.setStatus(props.status + 1)
              }}
              disabled={confirm}
            >次へ</Button>
          </div>
        </Box>
      </Paper>
    </Fade>
  )
}

type Keys = {
  private: string,
  public: string
}
const Step2 = (props: Props) => {
  const [ready, setReady] = useState(false)
  const keys:Keys = {
    private: "",
    public: ""
  }
  useEffect(() => {
    if (props.status === 1) {
      window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 4096,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: {name: "SHA-256"},
        },
        true,
        ["encrypt", "decrypt"]
      )
        .then(async function (key) {
          const pubKey = await window.crypto.subtle.exportKey(
            "jwk",
            key.publicKey
          )
          const priKey = await window.crypto.subtle.exportKey(
            "jwk",
            key.privateKey
          )
          const pubKeyStr = JSON.stringify(pubKey)
          const priKeyStr = JSON.stringify(priKey)
          keys.public = pubKeyStr
          keys.private = priKeyStr
          setReady(true)
        })
        .catch(function (err) {
          console.error(err);
        });
    }
  })
  const download = (key:string) => {
    const fileName = key+'.NPPAPKEY';
    if (key === 'private') {
      if (keys.private !== void 0) {
        const data = new Blob([keys.private], { type: 'text/json' });
        const jsonURL = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        document.body.appendChild(link);
        link.href = jsonURL;
        link.setAttribute('download', fileName);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      if (keys.public !== void 0) {
        const data = new Blob([keys.public], { type: 'text/json' });
        const jsonURL = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        document.body.appendChild(link);
        link.href = jsonURL;
        link.setAttribute('download', fileName);
        link.click();
        document.body.removeChild(link);
      }
    }
  }
  return (
    <Fade in={props.status == 1} style={{transitionDelay: `400ms`}} unmountOnExit>
      <Paper sx={{my: 5, p: 2}} elevation={12}>
        <p>キー生成</p>
        <Paper sx={{my: 5, p: 2}} elevation={1} >
          <Stack spacing={3} direction="row" alignItems="center">
            <LoadingButton loading={!ready} variant="contained" onClick={() => {download('private')}}>復号化キー</LoadingButton>
            <LoadingButton loading={!ready} variant="contained" onClick={() => {download('public')}}>暗号化キー</LoadingButton>
          </Stack>
        </Paper>
        <Alert severity="warning" sx={{my: 2}}>
          復号化キーは安全な場所に保管してください。他人には渡さないでください。ファイル送信を依頼する先に暗号化キーを送ってください。
        </Alert>
      </Paper>
    </Fade>
  )
}

const Keygen: NextPage = () => {
  const [status, setStatus] = useState(0)
  const [pass, setPass] = useState("")
  const steps = [
    '注意事項',
    'キー生成',
  ];
  return (
    <>
      <Container sx={{my: 3}} maxWidth="lg">
        <Typography variant="h5" component="h1">
          暗号化キー生成
        </Typography>
        <Box sx={{width: '100%', my: 2}}>
          <Stepper activeStep={status} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Step1 setStatus={setStatus} status={status}/>
          <Step2 setStatus={setStatus} status={status}/>
        </Box>
      </Container>
    </>
  )
}

export default Keygen
