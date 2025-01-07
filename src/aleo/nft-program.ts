export const NFTProgramId = 'zkoi_test2.aleo';

export const NFTProgram = `// The 'zkoi_test2.aleo' program.
program zkoi_test2.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
`;
