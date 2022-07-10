import readline from 'readline-sync'
import chalk from 'chalk';
import color from 'colors';
import moment from 'moment';
import {IgApiClient,IgCheckpointError,IgLoginRequiredError,IgUserHasLoggedOutError} from 'instagram-private-api'
import {existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync} from 'fs'

(async()=>{
    const username=readline.question("Enter your username".blue);
    const password=readline.question("Enter your password".blue);
    const sleep =Number(readline.question("Enter your sleep".blue))
    const ig = new IgApiClient()
   
    ig.state.generateDevice(username);
    
    let tokenPath = `./token/${username}.json`;
    let tokenDirectory = `./token`

    if (!existsSync(tokenDirectory)) {
        mkdirSync(tokenDirectory)
    }

   if(!existsSync(tokenPath)){

   
    const user=await ig.account.login(username,password).catch((error)=>{
        console.log(chalk.red(error.message));
        process.exit()
    })
   
       console.log(chalk.green('successfully logged in.'))

        console.log(chalk.yellow('Saving token'))

        const serialized = await ig.state.serialize();
        delete serialized.constants
        writeFileSync(tokenPath, JSON.stringify(serialized))

        console.log(chalk.greenBright('Token successfully saved.'))
}else{

    console.log(chalk.yellowBright('Token exist.'))

    let token = readFileSync(tokenPath, { encoding: 'utf-8' })

    await ig.state.deserialize(token);

    console.log(chalk.green('successfully logged in.'));
}

while(true){

       let medias=await ig.feed.timeline("pull_to_refresh").items().catch((error)=>{

        console.log(chalk.red(error.message));

        if(error instanceof IgLoginRequiredError || error instanceof IgUserHasLoggedOutError || error instanceof IgCheckpointError){
            unlinkSync(tokenPath);
            console.log(chalk.red('account relogin required.'));
            process.exit()
        }
    })

        if(medias?.length){
            for(const media of medias){

              if(!media.has_liked){
             
              
                // if (moment(new Date(media.taken_at * 1000).getTime()).isAfter(moment(new Date().getTime() - 60000))) {

                console.log(chalk.blueBright('found just now post.'.yellow))

                let { status } = await ig.media.like({ mediaId: media.id, moduleInfo: { module_name: "feed_timeline" }, d: 0 }).catch((error) => {
                            
                     console.log(chalk.red(error.message))

                     console.log(chalk.redBright('Post like failed.'))

                if (error instanceof IgLoginRequiredError || error instanceof IgUserHasLoggedOutError || error instanceof IgCheckpointError) {

                        unlinkSync(tokenPath);
                        console.log(chalk.red('account relogin required.'));
                        process.exit()

                    }
                 })

                if (status) {
                        console.log(chalk.green(`Post liked successfully ===> ${media.user.username} `))
                }

                // }else{
                //     console.log(chalk.yellow(`posted ${moment(new Date(media.taken_at * 1000).getTime()).fromNow()}`))
                // }
               
            }
            
        }

        console.log(chalk.magenta(`next run ${moment(new Date().getTime() + parseInt(sleep) * 1000).fromNow()}`))
        await new Promise((r) => setTimeout(r, (parseInt(sleep) * 1000)))
}
}
})();